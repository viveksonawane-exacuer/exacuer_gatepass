import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { settingsApi, type DashboardKpis, type VisitorListRow } from "@/api/vms";
import { buildFloorOptions } from "@/lib/floorOptions";
import {
  buildGateFlowSceneData,
  type BuildingOccupancy,
  type FloorOccupancy,
} from "@/lib/gateFlowBuildingData";
import { formatCount } from "@/lib/format";
import type { VisitorLang } from "@/i18n/visitorJourney";

type DetailSelection =
  | { type: "gate"; count: number }
  | { type: "floor"; building: BuildingOccupancy; floor: FloorOccupancy };

type Props = {
  lang: VisitorLang;
  kpis?: DashboardKpis;
  rows?: VisitorListRow[];
  loading?: boolean;
  onGateNavigate?: () => void;
  onFloorNavigate?: (building: BuildingOccupancy, floor: FloorOccupancy) => void;
};

const COLORS = {
  bg: 0xdce3ed,
  fog: 0xe5ecf4,
  frame: 0x1e2736,
  frameBezel: 0x334155,
  frameDark: 0x131a26,
  navy: 0x0f2347,
  navyDark: 0x091428,
  blueStripe: 0x1d4ed8,
  primary: 0x2563eb,
  inTransit: 0x4f46e5,
  completed: 0xea580c,
  orangeAccent: 0xea580c,
  ledBlue: 0x3b82f6,
  silverDeck: 0xd8dfea,
  gridMain: 0xb5c3d4,
  gridSub: 0xcdd8e6,
};

// Generous, realistic architectural dimensions
const BUILDING_W = 4.8;
const FLOOR_H = 1.02;
const FLOOR_GAP = 0.08;
const BUILDING_D = 0.65;

function drawShieldIcon(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number) {
  ctx.save();
  ctx.fillStyle = "#fff7ed";
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#fed7aa";
  ctx.lineWidth = 3;
  ctx.stroke();

  const sw = r * 0.9;
  const sh = r * 1.05;
  const sx = cx - sw / 2;
  const sy = cy - sh / 2 + 3;

  ctx.fillStyle = "#ea580c";
  ctx.beginPath();
  ctx.moveTo(sx, sy + 6);
  ctx.quadraticCurveTo(sx + sw / 2, sy - 2, sx + sw, sy + 6);
  ctx.lineTo(sx + sw, sy + sh * 0.55);
  ctx.quadraticCurveTo(sx + sw * 0.85, sy + sh * 0.95, sx + sw / 2, sy + sh);
  ctx.quadraticCurveTo(sx + sw * 0.15, sy + sh * 0.95, sx, sy + sh * 0.55);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "#ffffff";
  const starR = r * 0.32;
  ctx.beginPath();
  for (let i = 0; i < 5; i++) {
    const a = (i * Math.PI * 2) / 5 - Math.PI / 2;
    const ai = a + Math.PI / 5;
    const x1 = cx + Math.cos(a) * starR;
    const y1 = cy + 4 + Math.sin(a) * starR;
    const x2 = cx + Math.cos(ai) * (starR * 0.45);
    const y2 = cy + 4 + Math.sin(ai) * (starR * 0.45);
    if (i === 0) ctx.moveTo(x1, y1);
    else ctx.lineTo(x1, y1);
    ctx.lineTo(x2, y2);
  }
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function makeFloorPanelTexture(floor: FloorOccupancy, isSelected = false): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 1280;
  canvas.height = 360;
  const ctx = canvas.getContext("2d");
  if (!ctx) return new THREE.CanvasTexture(canvas);

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  if (isSelected) {
    ctx.strokeStyle = "#3b82f6";
    ctx.lineWidth = 14;
    ctx.strokeRect(7, 7, canvas.width - 14, canvas.height - 14);
  }

  // Header bar
  const headerH = 86;
  const headerGrad = ctx.createLinearGradient(0, 0, canvas.width, 0);
  headerGrad.addColorStop(0, "#0a1830");
  headerGrad.addColorStop(0.5, "#12264c");
  headerGrad.addColorStop(1, "#0a1830");
  ctx.fillStyle = headerGrad;
  ctx.fillRect(0, 0, canvas.width, headerH);

  // Floor Label (Left)
  ctx.fillStyle = "#ffffff";
  ctx.font = '700 40px "Poppins", "Inter", -apple-system, sans-serif';
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillText(floor.label, 44, headerH / 2);

  // Floor Badge Pill (Right)
  const badgeText = floor.floorCode || `FLOOR ${floor.number}`;
  ctx.font = '700 22px "Poppins", "Inter", -apple-system, sans-serif';
  const badgeW = Math.max(148, ctx.measureText(badgeText).width + 36);
  const badgeH = 44;
  const badgeX = canvas.width - badgeW - 36;
  const badgeY = (headerH - badgeH) / 2;

  ctx.fillStyle = "rgba(37, 99, 235, 0.65)";
  ctx.beginPath();
  ctx.roundRect(badgeX, badgeY, badgeW, badgeH, 10);
  ctx.fill();
  ctx.strokeStyle = "rgba(191, 219, 254, 0.6)";
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "center";
  ctx.fillText(badgeText, badgeX + badgeW / 2, badgeY + badgeH / 2 + 1);

  // Divider
  ctx.strokeStyle = "#cbd5e1";
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(0, headerH);
  ctx.lineTo(canvas.width, headerH);
  ctx.stroke();

  // 3 Metric Columns
  const colW = canvas.width / 3;
  const metrics = [
    { value: floor.pending, label: "PENDING", color: "#2563EB" },
    { value: floor.inTransit, label: "IN-TRANSIT", color: "#4F46E5" },
    { value: floor.completed, label: "COMPLETED", color: "#EA580C" },
  ];

  metrics.forEach((m, idx) => {
    const cx = idx * colW + colW / 2;

    ctx.fillStyle = m.color;
    ctx.font = '800 96px "Poppins", "Inter", -apple-system, sans-serif';
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(String(m.value), cx, 195);

    ctx.fillStyle = "#64748B";
    ctx.font = '700 22px "Poppins", "Inter", -apple-system, sans-serif';
    ctx.letterSpacing = "0.08em";
    ctx.fillText(m.label, cx, 285);
    ctx.letterSpacing = "0px";
  });

  // Vertical Separators
  ctx.strokeStyle = "#e2e8f0";
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(colW, headerH + 20);
  ctx.lineTo(colW, canvas.height - 20);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(colW * 2, headerH + 20);
  ctx.lineTo(colW * 2, canvas.height - 20);
  ctx.stroke();

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = true;
  texture.anisotropy = 16;
  return texture;
}

function makeSecurityGatePodTexture(pendingCount: number, approvedCount: number, isSelected = false): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 1100;
  canvas.height = 360;
  const ctx = canvas.getContext("2d");
  if (!ctx) return new THREE.CanvasTexture(canvas);

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  if (isSelected) {
    ctx.strokeStyle = "#ea580c";
    ctx.lineWidth = 14;
    ctx.strokeRect(7, 7, canvas.width - 14, canvas.height - 14);
  }

  // Header bar
  const headerH = 82;
  const headerGrad = ctx.createLinearGradient(0, 0, canvas.width, 0);
  headerGrad.addColorStop(0, "#0a1830");
  headerGrad.addColorStop(0.5, "#12264c");
  headerGrad.addColorStop(1, "#0a1830");
  ctx.fillStyle = headerGrad;
  ctx.fillRect(0, 0, canvas.width, headerH);

  // Header Title
  ctx.fillStyle = "#ffffff";
  ctx.font = '700 36px "Poppins", "Inter", -apple-system, sans-serif';
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillText("Main Campus Security Gate", 40, headerH / 2);

  // Badge Pill
  ctx.font = '700 20px "Poppins", "Inter", -apple-system, sans-serif';
  ctx.fillStyle = "rgba(234, 88, 12, 0.85)";
  ctx.beginPath();
  ctx.roundRect(canvas.width - 168, (headerH - 42) / 2, 136, 42, 10);
  ctx.fill();
  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "center";
  ctx.fillText("GATE DESK", canvas.width - 100, headerH / 2 + 1);

  // Orange Accent Stripe
  ctx.fillStyle = "#ea580c";
  ctx.fillRect(0, headerH, canvas.width, 7);

  // Left Side: Shield + Text
  drawShieldIcon(ctx, 96, 210, 44);

  ctx.textAlign = "left";
  ctx.fillStyle = "#0f172a";
  ctx.font = '800 44px "Poppins", "Inter", -apple-system, sans-serif';
  ctx.fillText("Security Gate", 168, 192);

  ctx.fillStyle = "#64748b";
  ctx.font = '500 26px "Poppins", "Inter", -apple-system, sans-serif';
  ctx.fillText("Visitor approval desk", 168, 235);

  ctx.fillStyle = "#475569";
  ctx.font = '600 24px "Poppins", "Inter", -apple-system, sans-serif';
  ctx.fillText(`Approved ${approvedCount ? `· ${approvedCount}` : ""}`, 48, 318);

  ctx.fillStyle = "#2563eb";
  ctx.beginPath();
  ctx.arc(186 + (approvedCount ? 40 : 0), 314, 7, 0, Math.PI * 2);
  ctx.fill();

  // Right Side: Bold Orange Pending Count
  ctx.fillStyle = "#ea580c";
  ctx.font = '800 168px "Poppins", "Inter", -apple-system, sans-serif';
  ctx.textAlign = "right";
  ctx.textBaseline = "middle";
  ctx.fillText(String(pendingCount), canvas.width - 56, 222);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = true;
  texture.anisotropy = 16;
  return texture;
}

function makeTopSignboardTexture(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 1280;
  canvas.height = 320;
  const ctx = canvas.getContext("2d");
  if (!ctx) return new THREE.CanvasTexture(canvas);

  const bgGrad = ctx.createLinearGradient(0, 0, canvas.width, 0);
  bgGrad.addColorStop(0, "#071124");
  bgGrad.addColorStop(0.5, "#0f234a");
  bgGrad.addColorStop(1, "#071124");
  ctx.fillStyle = bgGrad;
  ctx.beginPath();
  ctx.roundRect(12, 12, canvas.width - 24, canvas.height - 24, 28);
  ctx.fill();

  ctx.strokeStyle = "rgba(59, 130, 246, 0.9)";
  ctx.lineWidth = 8;
  ctx.shadowColor = "rgba(59, 130, 246, 0.95)";
  ctx.shadowBlur = 24;
  ctx.stroke();

  ctx.shadowColor = "rgba(59, 130, 246, 1)";
  ctx.shadowBlur = 36;
  ctx.fillStyle = "#ffffff";
  ctx.font = '800 78px "Poppins", "Inter", -apple-system, sans-serif';
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.letterSpacing = "0.06em";
  ctx.fillText("EXACUER GLOBAL", canvas.width / 2, canvas.height / 2);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = true;
  texture.anisotropy = 16;
  return texture;
}

function makeBarrierStripedTexture(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 64;
  const ctx = canvas.getContext("2d");
  if (!ctx) return new THREE.CanvasTexture(canvas);

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const stripeW = 44;
  for (let x = 32; x < canvas.width - 32; x += stripeW * 2) {
    ctx.fillStyle = "#ea580c";
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x + stripeW, 0);
    ctx.lineTo(x + stripeW - 14, canvas.height);
    ctx.lineTo(x - 14, canvas.height);
    ctx.closePath();
    ctx.fill();
  }

  ctx.fillStyle = "#0f172a";
  ctx.fillRect(0, 0, 18, canvas.height);
  ctx.fillRect(canvas.width - 18, 0, 18, canvas.height);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function disposeMaterial(material: THREE.Material | THREE.Material[]) {
  const materials = Array.isArray(material) ? material : [material];
  for (const mat of materials) {
    if (mat instanceof THREE.MeshStandardMaterial || mat instanceof THREE.MeshBasicMaterial) {
      mat.map?.dispose();
    }
    if (mat instanceof THREE.SpriteMaterial) {
      mat.map?.dispose();
    }
    mat.dispose();
  }
}

function disposeObject(object: THREE.Object3D) {
  object.traverse((child) => {
    if (child instanceof THREE.Mesh || child instanceof THREE.Sprite) {
      child.geometry?.dispose();
      disposeMaterial(child.material);
    }
  });
}

function buildCampusScene(
  building: BuildingOccupancy,
  gate: { pendingApproval: number; approved: number },
  selection: DetailSelection | null,
): { group: THREE.Group; hitMeshes: THREE.Mesh[]; centerHeight: number; totalHeight: number; barrierPivot: THREE.Group } {
  const sceneGroup = new THREE.Group();
  const hitMeshes: THREE.Mesh[] = [];

  const floors = building.floors; // [Ground Floor, First Floor, Second Floor]
  const floorCount = floors.length;
  const stackHeight = floorCount * (FLOOR_H + FLOOR_GAP);

  // ── 1. MAIN BUILDING TOWER WITH GENEROUS ARCHITECTURAL WIDTH ──
  const buildingGroup = new THREE.Group();
  buildingGroup.position.z = -0.2;

  // Solid Backing Spine
  const spine = new THREE.Mesh(
    new THREE.BoxGeometry(BUILDING_W + 0.4, stackHeight + 0.5, 0.18),
    new THREE.MeshStandardMaterial({ color: COLORS.frame, roughness: 0.45, metalness: 0.35 }),
  );
  spine.position.y = stackHeight / 2 + 0.1;
  spine.position.z = -0.14;
  buildingGroup.add(spine);

  // Broad Architectural Side Pillars
  const pillarW = 0.28;
  const leftPillar = new THREE.Mesh(
    new THREE.BoxGeometry(pillarW, stackHeight + 0.55, BUILDING_D),
    new THREE.MeshStandardMaterial({ color: COLORS.frameDark, roughness: 0.38, metalness: 0.5 }),
  );
  leftPillar.position.set(-BUILDING_W / 2 - pillarW / 2 + 0.02, stackHeight / 2 + 0.1, 0.06);
  buildingGroup.add(leftPillar);

  const rightPillar = leftPillar.clone();
  rightPillar.position.x = BUILDING_W / 2 + pillarW / 2 - 0.02;
  buildingGroup.add(rightPillar);

  // Royal Blue Vertical Accent Lighting Trim
  const blueTrim = new THREE.Mesh(
    new THREE.BoxGeometry(0.1, stackHeight + 0.46, 0.04),
    new THREE.MeshStandardMaterial({ color: COLORS.blueStripe, roughness: 0.3, metalness: 0.55 }),
  );
  blueTrim.position.set(-BUILDING_W / 2 + 0.16, stackHeight / 2 + 0.1, 0.22);
  buildingGroup.add(blueTrim);

  // Roof Canopy
  const roofH = 0.24;
  const roof = new THREE.Mesh(
    new THREE.BoxGeometry(BUILDING_W + 0.6, roofH, BUILDING_D + 0.1),
    new THREE.MeshStandardMaterial({ color: COLORS.frameDark, roughness: 0.35, metalness: 0.5 }),
  );
  roof.position.y = stackHeight + roofH / 2 + 0.15;
  roof.position.z = 0.06;
  buildingGroup.add(roof);

  const roofBevel = new THREE.Mesh(
    new THREE.BoxGeometry(BUILDING_W + 0.48, 0.06, BUILDING_D - 0.02),
    new THREE.MeshStandardMaterial({ color: COLORS.frameBezel, roughness: 0.4, metalness: 0.4 }),
  );
  roofBevel.position.y = stackHeight + roofH + 0.18;
  roofBevel.position.z = 0.06;
  buildingGroup.add(roofBevel);

  // Glowing Blue LED Accent Bar on Roof
  const ledBar = new THREE.Mesh(
    new THREE.BoxGeometry(0.44, 0.04, 0.06),
    new THREE.MeshStandardMaterial({ color: COLORS.ledBlue, emissive: COLORS.ledBlue, emissiveIntensity: 0.95 }),
  );
  ledBar.position.set(-BUILDING_W / 2 + 0.3, stackHeight + roofH + 0.02, 0.24);
  ledBar.userData.led = true;
  buildingGroup.add(ledBar);

  // Top Neon Signboard
  const signStem = new THREE.Mesh(
    new THREE.CylinderGeometry(0.18, 0.22, 0.34, 20),
    new THREE.MeshStandardMaterial({ color: COLORS.blueStripe, roughness: 0.3, metalness: 0.6 }),
  );
  signStem.position.set(0, stackHeight + roofH + 0.32, 0.06);
  buildingGroup.add(signStem);

  const signW = BUILDING_W * 0.74;
  const signH = 0.76;
  const signD = 0.14;
  const signY = stackHeight + roofH + 0.72;

  const signHousing = new THREE.Mesh(
    new THREE.BoxGeometry(signW + 0.08, signH + 0.08, signD),
    new THREE.MeshStandardMaterial({ color: COLORS.navyDark, roughness: 0.3, metalness: 0.65 }),
  );
  signHousing.position.set(0, signY, 0.06);
  signHousing.userData.neonSign = true;
  buildingGroup.add(signHousing);

  const signFace = new THREE.Mesh(
    new THREE.PlaneGeometry(signW, signH),
    new THREE.MeshBasicMaterial({ map: makeTopSignboardTexture(), transparent: false }),
  );
  signFace.position.set(0, signY, 0.06 + signD / 2 + 0.005);
  buildingGroup.add(signFace);

  // Floors: Ground Floor (0), First Floor (1), Second Floor (2)
  floors.forEach((floor, index) => {
    const y = index * (FLOOR_H + FLOOR_GAP) + 0.18;
    const isSelected =
      selection &&
      selection.type === "floor" &&
      selection.floor.label === floor.label &&
      selection.floor.number === floor.number;

    const floorGroup = new THREE.Group();
    floorGroup.position.y = y;

    const shelf = new THREE.Mesh(
      new THREE.BoxGeometry(BUILDING_W + 0.28, 0.075, BUILDING_D - 0.06),
      new THREE.MeshStandardMaterial({ color: COLORS.frameBezel, roughness: 0.4, metalness: 0.45 }),
    );
    shelf.position.set(0, 0.038, 0.06);
    floorGroup.add(shelf);

    const backplate = new THREE.Mesh(
      new THREE.BoxGeometry(BUILDING_W - 0.02, FLOOR_H - 0.04, 0.05),
      new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.8 }),
    );
    backplate.position.set(0, FLOOR_H / 2 + 0.038, 0.16);
    floorGroup.add(backplate);

    const texture = makeFloorPanelTexture(floor, Boolean(isSelected));
    const panelMaterial = new THREE.MeshBasicMaterial({ map: texture, transparent: false });
    panelMaterial.polygonOffset = true;
    panelMaterial.polygonOffsetFactor = -1;
    panelMaterial.polygonOffsetUnits = -1;

    const panel = new THREE.Mesh(
      new THREE.PlaneGeometry(BUILDING_W - 0.04, FLOOR_H - 0.06),
      panelMaterial,
    );
    panel.position.set(0, FLOOR_H / 2 + 0.038, 0.195);
    panel.userData = { floor, building, isFloor: true, index };
    floorGroup.add(panel);

    const hitBox = new THREE.Mesh(
      new THREE.BoxGeometry(BUILDING_W + 0.15, FLOOR_H + 0.04, BUILDING_D),
      new THREE.MeshBasicMaterial({ visible: false }),
    );
    hitBox.position.set(0, FLOOR_H / 2 + 0.038, 0.1);
    hitBox.userData = { floor, building, isFloor: true, index };
    floorGroup.add(hitBox);
    hitMeshes.push(hitBox);

    buildingGroup.add(floorGroup);
  });

  // Building Foundation Base Platform
  const baseW = BUILDING_W + 0.8;
  const baseH = 0.22;
  const baseD = BUILDING_D + 0.85;
  const baseDeck = new THREE.Mesh(
    new THREE.BoxGeometry(baseW, baseH, baseD),
    new THREE.MeshStandardMaterial({ color: COLORS.silverDeck, roughness: 0.3, metalness: 0.65 }),
  );
  baseDeck.position.set(0, 0.04, 0.24);
  buildingGroup.add(baseDeck);

  sceneGroup.add(buildingGroup);

  // ── 2. SEPARATED SECURITY GATE STATION (IN FRONT OF BUILDING) ──
  const isGateSelected = selection && selection.type === "gate";
  const gateGroup = new THREE.Group();
  gateGroup.position.set(0, -0.42, 1.35);

  const podW = 3.2;
  const podH = 0.92;
  const podD = 0.34;

  const podHousing = new THREE.Mesh(
    new THREE.BoxGeometry(podW + 0.08, podH + 0.08, podD),
    new THREE.MeshStandardMaterial({ color: COLORS.frameDark, roughness: 0.38, metalness: 0.5 }),
  );
  podHousing.position.set(0, podH / 2, 0);
  gateGroup.add(podHousing);

  const podTexture = makeSecurityGatePodTexture(gate.pendingApproval, gate.approved, Boolean(isGateSelected));
  const podFaceMat = new THREE.MeshBasicMaterial({ map: podTexture, transparent: false });
  podFaceMat.polygonOffset = true;
  podFaceMat.polygonOffsetFactor = -1;
  podFaceMat.polygonOffsetUnits = -1;

  const podFace = new THREE.Mesh(
    new THREE.PlaneGeometry(podW, podH),
    podFaceMat,
  );
  podFace.position.set(0, podH / 2, podD / 2 + 0.005);
  podFace.userData = { isGate: true };
  gateGroup.add(podFace);

  const gateHitBox = new THREE.Mesh(
    new THREE.BoxGeometry(podW + 0.25, podH + 0.25, podD + 0.45),
    new THREE.MeshBasicMaterial({ visible: false }),
  );
  gateHitBox.position.set(0, podH / 2, 0.1);
  gateHitBox.userData = { isGate: true };
  gateGroup.add(gateHitBox);
  hitMeshes.push(gateHitBox);

  // Motorized Boom Barrier with Pivot
  const barrierPost = new THREE.Mesh(
    new THREE.CylinderGeometry(0.13, 0.15, 0.58, 24),
    new THREE.MeshStandardMaterial({ color: COLORS.orangeAccent, roughness: 0.3, metalness: 0.25 }),
  );
  barrierPost.position.set(-podW / 2 + 0.35, -0.28, 0.5);
  gateGroup.add(barrierPost);

  const barrierPivot = new THREE.Group();
  barrierPivot.position.set(-podW / 2 + 0.35, 0.02, 0.5);

  const armGeo = new THREE.CylinderGeometry(0.04, 0.04, 2.6, 20);
  armGeo.rotateZ(Math.PI / 2);
  armGeo.translate(1.3, 0, 0); // Pivot at the post
  const barrierArm = new THREE.Mesh(
    armGeo,
    new THREE.MeshStandardMaterial({ map: makeBarrierStripedTexture(), roughness: 0.35, metalness: 0.2 }),
  );
  barrierArm.userData.barrierArm = true;
  barrierPivot.add(barrierArm);
  gateGroup.add(barrierPivot);

  sceneGroup.add(gateGroup);

  const totalHeight = signY + signH / 2 + 0.9;
  const centerHeight = (signY + signH / 2 - 0.7) / 2;

  return { group: sceneGroup, hitMeshes, centerHeight, totalHeight, barrierPivot };
}

export function GateFlowBuilding3D({
  lang,
  kpis = {},
  rows = [],
  loading = false,
  onGateNavigate,
  onFloorNavigate,
}: Props) {
  const stageRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const campusRef = useRef<THREE.Group | null>(null);
  const hitMeshesRef = useRef<THREE.Mesh[]>([]);
  const barrierPivotRef = useRef<THREE.Group | null>(null);
  const frameRef = useRef<number>(0);
  const visibleRef = useRef(true);
  const targetRef = useRef<THREE.Vector3>(new THREE.Vector3(0, 1.25, 0.35));

  const [floorOptions, setFloorOptions] = useState<ReturnType<typeof buildFloorOptions>>([]);
  const [selection, setSelection] = useState<DetailSelection | null>(null);

  const sceneData = useMemo(
    () => buildGateFlowSceneData(kpis, rows, floorOptions),
    [kpis, rows, floorOptions],
  );

  const mainBuilding = sceneData.buildings[0];

  useEffect(() => {
    let cancelled = false;
    void settingsApi
      .getMasters()
      .then((masters) => {
        if (cancelled) return;
        setFloorOptions(buildFloorOptions(masters || {}));
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(COLORS.bg);
    scene.fog = new THREE.Fog(COLORS.fog, 16, 44);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(44, stage.clientWidth / stage.clientHeight, 0.1, 100);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.8));
    renderer.setSize(stage.clientWidth, stage.clientHeight);
    renderer.domElement.className = "ds-gateflow-3d__canvas";
    stage.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Professional Studio Lighting
    scene.add(new THREE.HemisphereLight(0xffffff, 0x8ea2be, 1.35));

    const key = new THREE.DirectionalLight(0xffffff, 1.2);
    key.position.set(6, 15, 9);
    scene.add(key);

    const fill = new THREE.DirectionalLight(0xb0cdfa, 0.55);
    fill.position.set(-6, 7, -3);
    scene.add(fill);

    const rim = new THREE.PointLight(0x60a5fa, 0.8, 28);
    rim.position.set(0, 8, 6);
    scene.add(rim);

    // Studio Floor & Grid
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(38, 38),
      new THREE.MeshStandardMaterial({ color: 0xd3dce8, roughness: 0.88, metalness: 0.1 }),
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -1.18;
    scene.add(floor);

    const grid = new THREE.GridHelper(32, 42, COLORS.gridMain, COLORS.gridSub);
    grid.position.y = -1.178;
    scene.add(grid);

    const observer = new IntersectionObserver(
      (entries) => {
        visibleRef.current = entries[0]?.isIntersecting ?? true;
      },
      { threshold: 0.1 },
    );
    observer.observe(stage);

    return () => {
      observer.disconnect();
      cancelAnimationFrame(frameRef.current);
      if (campusRef.current) disposeObject(campusRef.current);
      renderer.dispose();
      stage.removeChild(renderer.domElement);
      sceneRef.current = null;
      cameraRef.current = null;
      rendererRef.current = null;
      campusRef.current = null;
      hitMeshesRef.current = [];
      barrierPivotRef.current = null;
    };
  }, []);

  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene || !mainBuilding) return;

    if (campusRef.current) {
      scene.remove(campusRef.current);
      disposeObject(campusRef.current);
    }

    const { group, hitMeshes, centerHeight, barrierPivot } = buildCampusScene(
      mainBuilding,
      sceneData.gate,
      selection,
    );

    // Smooth intro spring entrance animation
    group.position.y = -0.35;
    group.scale.set(0.96, 0.96, 0.96);

    scene.add(group);
    campusRef.current = group;
    hitMeshesRef.current = hitMeshes;
    barrierPivotRef.current = barrierPivot;

    targetRef.current = new THREE.Vector3(0, centerHeight, 0.35);

    const camera = cameraRef.current;
    if (camera) {
      // By default frames the generous width 3-floor building + front gate console & boom barrier
      camera.position.set(0.06, centerHeight + 0.42, 8.6);
      camera.lookAt(targetRef.current);
    }
  }, [sceneData, mainBuilding, selection]);

  useEffect(() => {
    const stage = stageRef.current;
    const renderer = rendererRef.current;
    const scene = sceneRef.current;
    const camera = cameraRef.current;
    if (!stage || !renderer || !scene || !camera) return;

    let radius = 8.6;
    let theta = 0.02;
    let phi = 1.26;

    const updateCamera = () => {
      const target = targetRef.current;
      camera.position.x = target.x + radius * Math.sin(phi) * Math.sin(theta);
      camera.position.z = target.z + radius * Math.sin(phi) * Math.cos(theta);
      camera.position.y = target.y + radius * Math.cos(phi);
      camera.lookAt(target);
    };
    updateCamera();

    let dragging = false;
    let lastX = 0;
    let lastY = 0;
    const dom = renderer.domElement;

    const onPointerDown = (e: PointerEvent) => {
      dragging = true;
      lastX = e.clientX;
      lastY = e.clientY;
      dom.classList.add("is-dragging");
    };
    const onPointerUp = () => {
      dragging = false;
      dom.classList.remove("is-dragging");
    };
    const onPointerMove = (e: PointerEvent) => {
      if (!dragging) return;
      theta -= (e.clientX - lastX) * 0.004;
      phi = Math.min(Math.max(phi - (e.clientY - lastY) * 0.004, 1.05), 1.45);
      lastX = e.clientX;
      lastY = e.clientY;
      updateCamera();
    };
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      radius = Math.min(Math.max(radius + e.deltaY * 0.008, 6.0), 14);
      updateCamera();
    };

    dom.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointermove", onPointerMove);
    dom.addEventListener("wheel", onWheel, { passive: false });

    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    const onClick = (e: MouseEvent) => {
      const rect = dom.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(mouse, camera);
      const hits = raycaster.intersectObjects(hitMeshesRef.current, false);
      if (!hits.length) {
        setSelection(null);
        return;
      }
      const obj = hits[0].object;
      if (obj.userData.isGate) {
        setSelection({ type: "gate", count: sceneData.gate.pendingApproval });
        return;
      }
      if (obj.userData.floor && obj.userData.building) {
        setSelection({
          type: "floor",
          building: obj.userData.building as BuildingOccupancy,
          floor: obj.userData.floor as FloorOccupancy,
        });
      }
    };
    dom.addEventListener("click", onClick);

    const clock = new THREE.Clock();
    const animate = () => {
      frameRef.current = requestAnimationFrame(animate);
      if (!visibleRef.current) return;
      const t = clock.getElapsedTime();

      // Smooth intro entrance lerp
      if (campusRef.current) {
        campusRef.current.position.y += (0 - campusRef.current.position.y) * 0.1;
        const s = campusRef.current.scale.x;
        if (s < 0.999) {
          const nextS = s + (1.0 - s) * 0.1;
          campusRef.current.scale.set(nextS, nextS, nextS);
        }
      }

      // Smooth motorized boom barrier movement: lifts up and down realistically
      if (barrierPivotRef.current) {
        // Cycle: open every 8s, hold for 2.5s, close smoothly
        const cycle = t % 8.0;
        let targetAngle = 0;
        if (cycle > 1.5 && cycle < 4.5) {
          targetAngle = 0.95; // ~55 degrees open
        }
        barrierPivotRef.current.rotation.z += (targetAngle - barrierPivotRef.current.rotation.z) * 0.06;
      }

      // Breathing glow animations
      campusRef.current?.traverse((child) => {
        if (child.userData.led) {
          const mat = (child as THREE.Mesh).material as THREE.MeshStandardMaterial;
          mat.emissiveIntensity = 0.8 + Math.sin(t * 2.5) * 0.25;
        }
      });

      renderer.render(scene, camera);
    };
    animate();

    const onResize = () => {
      if (!stageRef.current) return;
      camera.aspect = stageRef.current.clientWidth / stageRef.current.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(stageRef.current.clientWidth, stageRef.current.clientHeight);
    };
    window.addEventListener("resize", onResize);

    return () => {
      dom.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointermove", onPointerMove);
      dom.removeEventListener("wheel", onWheel);
      dom.removeEventListener("click", onClick);
      window.removeEventListener("resize", onResize);
      cancelAnimationFrame(frameRef.current);
    };
  }, [sceneData, mainBuilding]);

  const liveLabel = loading ? "Loading…" : `${formatCount(sceneData.totalLive, lang)} live on site`;

  return (
    <div className="ds-gateflow-3d">
      <div className="ds-gateflow-3d__meta">
        <span className="ds-gateflow-3d__hint">Drag to orbit · scroll to zoom · tap a floor or gate</span>
        <span className="ds-gateflow-3d__live">
          <span className="ds-gateflow-3d__live-dot" aria-hidden />
          {liveLabel}
        </span>
      </div>

      <div className="ds-gateflow-3d__stage ds-gateflow-3d__stage--kiosk" ref={stageRef}>
        {/* CAMPUS 3D Watermark */}
        <div className="ds-gateflow-3d__campus-badge" aria-hidden>
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#2563EB" strokeWidth="2.2">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
          </svg>
          <span>CAMPUS 3D</span>
        </div>

        {selection ? (
          <div className="ds-gateflow-3d__panel" role="dialog" aria-label="Building detail">
            <button
              type="button"
              className="ds-gateflow-3d__panel-close"
              onClick={() => setSelection(null)}
              aria-label="Close"
            >
              ×
            </button>
            {selection.type === "gate" ? (
              <>
                <strong className="ds-gateflow-3d__panel-title">Main Campus Security Gate</strong>
                <div className="ds-gateflow-3d__panel-row">
                  <span>Pending approval</span>
                  <b>{formatCount(sceneData.gate.pendingApproval, lang)}</b>
                </div>
                <div className="ds-gateflow-3d__panel-row">
                  <span>Approved passes</span>
                  <b>{formatCount(sceneData.gate.approved, lang)}</b>
                </div>
                {onGateNavigate ? (
                  <button type="button" className="ds-gateflow-3d__panel-action" onClick={onGateNavigate}>
                    Open approvals queue
                  </button>
                ) : null}
              </>
            ) : (
              <>
                <strong className="ds-gateflow-3d__panel-title">{selection.floor.label}</strong>
                <div className="ds-gateflow-3d__panel-row">
                  <span>Pending</span>
                  <b>{formatCount(selection.floor.pending, lang)}</b>
                </div>
                <div className="ds-gateflow-3d__panel-row">
                  <span>In transit</span>
                  <b>{formatCount(selection.floor.inTransit, lang)}</b>
                </div>
                <div className="ds-gateflow-3d__panel-row">
                  <span>Completed today</span>
                  <b>{formatCount(selection.floor.completed, lang)}</b>
                </div>
                {onFloorNavigate ? (
                  <button
                    type="button"
                    className="ds-gateflow-3d__panel-action"
                    onClick={() => onFloorNavigate(selection.building, selection.floor)}
                  >
                    View on premises
                  </button>
                ) : null}
              </>
            )}
          </div>
        ) : null}
      </div>

      <div className="ds-gateflow-3d__legend" aria-hidden>
        <span><i style={{ background: "#2563EB" }} />Pending</span>
        <span><i style={{ background: "#4F46E5" }} />In transit</span>
        <span><i style={{ background: "#EA580C" }} />Completed</span>
        <span><i style={{ background: "#0F766E" }} />Live on site</span>
      </div>

      {mainBuilding ? (
        <div className="ds-gateflow-3d__floors">
          {/* Security Gate Chip */}
          <button
            type="button"
            className={`ds-gateflow-3d__floor-chip${sceneData.gate.pendingApproval > 0 ? " is-active" : ""}${selection?.type === "gate" ? " is-selected" : ""}`}
            onClick={() => setSelection({ type: "gate", count: sceneData.gate.pendingApproval })}
          >
            <strong>Security Gate</strong>
            <span>{formatCount(sceneData.gate.pendingApproval, lang)} pending approval</span>
          </button>

          {/* Building Floors: Ground Floor, First Floor, Second Floor */}
          {mainBuilding.floors.map((floor) => {
            const total = floor.pending + floor.inTransit + floor.completed;
            const isSelected =
              selection &&
              selection.type === "floor" &&
              selection.floor.label === floor.label &&
              selection.floor.number === floor.number;
            return (
              <button
                type="button"
                key={`${floor.label}-${floor.number}`}
                className={`ds-gateflow-3d__floor-chip${total > 0 ? " is-active" : ""}${isSelected ? " is-selected" : ""}`}
                onClick={() => setSelection({ type: "floor", building: mainBuilding, floor })}
              >
                <strong>{floor.label}</strong>
                <span>
                  {formatCount(floor.inTransit, lang)} live · {formatCount(floor.completed, lang)} done
                </span>
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
