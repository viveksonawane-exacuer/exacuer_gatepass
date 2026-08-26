"""Authentication helpers — resolve User from mobile and open Frappe session."""

from __future__ import annotations

import frappe
from frappe import _
from frappe.utils import cstr

from visitor_management.auth.permissions import (
	get_doctype_permissions,
	user_can_approve,
	vms_roles_for_user,
)
from visitor_management.react_api.otp import normalize_mobile


def find_user_by_mobile(mobile: str) -> str | None:
	"""Match User.mobile_no or linked Employee.cell_number (10-digit tolerant)."""
	mobile = normalize_mobile(mobile)
	if not mobile:
		return None

	last10 = mobile[-10:]
	candidates = {mobile, last10, f"91{last10}", f"+91{last10}"}

	for value in candidates:
		user = frappe.db.get_value("User", {"mobile_no": value, "enabled": 1}, "name")
		if user:
			return user

	if frappe.db.exists("DocType", "Employee"):
		for value in candidates:
			user_id = frappe.db.get_value(
				"Employee",
				{"cell_number": value, "status": "Active"},
				"user_id",
			)
			if user_id and frappe.db.get_value("User", user_id, "enabled"):
				return user_id

	# Loose match on last 10 digits for Employee
	if frappe.db.exists("DocType", "Employee"):
		rows = frappe.get_all(
			"Employee",
			filters={"status": "Active", "user_id": ["is", "set"]},
			fields=["user_id", "cell_number"],
			limit_page_length=500,
		)
		for row in rows:
			cell = normalize_mobile(row.cell_number)
			if cell and cell[-10:] == last10 and frappe.db.get_value("User", row.user_id, "enabled"):
				return row.user_id

	return None


def login_as_user(user: str) -> None:
	"""Establish Frappe session for `user` (sets sid cookie)."""
	frappe.local.login_manager.login_as(user)
	frappe.db.commit()


def logout_current() -> None:
	if frappe.session.user and frappe.session.user != "Guest":
		frappe.local.login_manager.logout()
		frappe.db.commit()


def get_profile(user: str | None = None) -> dict:
	user = user or frappe.session.user
	if not user or user == "Guest":
		return {
			"authenticated": False,
			"session_type": "guest",
			"user": "Guest",
			"roles": [],
			"permissions": {},
			"can_approve": False,
		}

	row = frappe.db.get_value(
		"User",
		user,
		["name", "full_name", "first_name", "user_image", "mobile_no", "email"],
		as_dict=True,
	) or {"name": user}

	roles = frappe.get_roles(user) or []
	permissions = get_doctype_permissions(user)

	return {
		"authenticated": True,
		"session_type": "user",
		"user": row.get("name") or user,
		"full_name": row.get("full_name"),
		"first_name": row.get("first_name"),
		"user_image": row.get("user_image"),
		"mobile_no": row.get("mobile_no"),
		"email": row.get("email"),
		"roles": roles,
		"vms_roles": vms_roles_for_user(roles),
		"permissions": permissions,
		"can_approve": user_can_approve(user),
		"csrf_token": cstr(frappe.sessions.get_csrf_token()),
	}


@frappe.whitelist()
def update_user_photo(photo_data: str) -> dict:
	user = frappe.session.user
	if not user or user == "Guest":
		frappe.throw(_("Not authenticated"), frappe.PermissionError)

	if photo_data and photo_data.startswith("data:image"):
		import base64
		from frappe.utils.file_manager import save_file
		header, encoded = photo_data.split(",", 1)
		file_content = base64.b64decode(encoded)
		file_name = f"profile_{user}_{frappe.utils.now_datetime().strftime('%Y%m%d%H%M%S')}.jpg"
		_file = save_file(file_name, file_content, "User", user, is_private=0)
		frappe.db.set_value("User", user, "user_image", _file.file_url)
		frappe.db.commit()
		return {"success": True, "user_image": _file.file_url}
	elif photo_data:
		frappe.db.set_value("User", user, "user_image", photo_data)
		frappe.db.commit()
		return {"success": True, "user_image": photo_data}

	return {"success": False, "error": "Invalid photo"}
