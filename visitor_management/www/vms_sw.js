if(!self.define){let e,n={};const c=(c,a)=>(c=new URL(c+".js",a).href,n[c]||new Promise(n=>{if("document"in self){const e=document.createElement("script");e.src=c,e.onload=n,document.head.appendChild(e)}else e=c,importScripts(c),n()}).then(()=>{let e=n[c];if(!e)throw new Error(`Module ${c} didn’t register its module`);return e}));self.define=(a,i)=>{const r=e||("document"in self?document.currentScript.src:"")||location.href;if(n[r])return;let d={};const s=e=>c(e,r),f={module:{uri:r},exports:d,require:s};n[r]=Promise.all(a.map(e=>f[e]||s(e))).then(e=>(i(...e),d))}}define(["/assets/visitor_management/frontend/workbox-b3c04f83"],function(e){"use strict";self.addEventListener("message",e=>{e.data&&"SKIP_WAITING"===e.data.type&&self.skipWaiting()}),e.precacheAndRoute([{url:"/assets/visitor_management/frontend/vms-chunk-web8.js",revision:"5a559c89230cd3a5777c90308e0985ce"},{url:"/assets/visitor_management/frontend/vms-chunk-web7.js",revision:"06465979837aef240e0229331b55f237"},{url:"/assets/visitor_management/frontend/vms-chunk-web6.js",revision:"1fa9c2f8cec750ec0f41f8973c6dba08"},{url:"/assets/visitor_management/frontend/vms-chunk-web5.js",revision:"bf853d15c2053097bb0577b072363a39"},{url:"/assets/visitor_management/frontend/vms-chunk-web4.js",revision:"223d421d43ddf169ffbe0fe4b4551b9b"},{url:"/assets/visitor_management/frontend/vms-chunk-web3.js",revision:"dc1cf54dba031e49d063cbccf2a3ed30"},{url:"/assets/visitor_management/frontend/vms-chunk-web2.js",revision:"a32da1010fbaaba9a03a9b8f8925abde"},{url:"/assets/visitor_management/frontend/vms-chunk-web.js",revision:"996074863f389987d02c0064f77e664e"},{url:"/assets/visitor_management/frontend/vms-chunk-index.js",revision:"f3a6f980d20ec5b05602d46f3b936ba4"},{url:"/assets/visitor_management/frontend/vms-chunk-capacitor-init.js",revision:"c4ca906123f2dea7f7cd6fcc4755e3c9"},{url:"/assets/visitor_management/frontend/vms-asset-index.css",revision:"a4cd732d00b31060e9339eb34865fcd4"},{url:"/assets/visitor_management/frontend/vms-app.js",revision:"dc6a73bf01e6e66679686e246ab48a8b"},{url:"/assets/visitor_management/frontend/vite.svg",revision:"e1b5a649812a3640929b2e2a896f7b9a"},{url:"/assets/visitor_management/frontend/manifest.webmanifest",revision:"65dfae982e09fab3abac6a145f5e67a7"},{url:"/assets/visitor_management/frontend/index.html",revision:"25f193a26fae4a329eb2572e04a2d753"},{url:"/assets/visitor_management/frontend/icons/icon-512.png",revision:"ad31f68276d063adc2677918aad8b41f"},{url:"/assets/visitor_management/frontend/icons/icon-192.png",revision:"728a1fb8a8207f499b7bf3756dd5abc1"},{url:"/assets/visitor_management/frontend/icons/icon-180.png",revision:"9eeb300390a1f706b08d1a641c26d6c8"},{url:"/assets/visitor_management/frontend/brand/om-symbol.png",revision:"c20d5178bada101316834f6b8a030a76"},{url:"/assets/visitor_management/frontend/brand/exacuer-logo.png",revision:"5dc00fe4e735747bd0b42f3fdbf9e99f"},{url:"/assets/visitor_management/frontend/brand/exacuer-logo-light.png",revision:"5dc00fe4e735747bd0b42f3fdbf9e99f"},{url:"/assets/visitor_management/frontend/brand/exacuer-logo-dark.png",revision:"5dc00fe4e735747bd0b42f3fdbf9e99f"},{url:"/assets/visitor_management/frontend/brand/exacuer-icon.png",revision:"cf6f0d40961d1907d2cd0acc136c83a7"},{url:"/assets/visitor_management/frontend/brand/exacuer-icon-light.png",revision:"cf6f0d40961d1907d2cd0acc136c83a7"},{url:"/assets/visitor_management/frontend/brand/exacuer-icon-dark.png",revision:"cf6f0d40961d1907d2cd0acc136c83a7"},{url:"/assets/visitor_management/frontend/brand/exacuer-icon-dark.png",revision:"cf6f0d40961d1907d2cd0acc136c83a7"},{url:"/assets/visitor_management/frontend/brand/exacuer-icon-light.png",revision:"cf6f0d40961d1907d2cd0acc136c83a7"},{url:"/assets/visitor_management/frontend/brand/exacuer-icon.png",revision:"cf6f0d40961d1907d2cd0acc136c83a7"},{url:"/assets/visitor_management/frontend/brand/exacuer-logo-dark.png",revision:"5dc00fe4e735747bd0b42f3fdbf9e99f"},{url:"/assets/visitor_management/frontend/brand/exacuer-logo-light.png",revision:"5dc00fe4e735747bd0b42f3fdbf9e99f"},{url:"/assets/visitor_management/frontend/brand/exacuer-logo.png",revision:"5dc00fe4e735747bd0b42f3fdbf9e99f"},{url:"/assets/visitor_management/frontend/brand/om-symbol.png",revision:"c20d5178bada101316834f6b8a030a76"},{url:"/assets/visitor_management/frontend/icons/icon-180.png",revision:"9eeb300390a1f706b08d1a641c26d6c8"},{url:"/assets/visitor_management/frontend/icons/icon-192.png",revision:"728a1fb8a8207f499b7bf3756dd5abc1"},{url:"/assets/visitor_management/frontend/icons/icon-512.png",revision:"ad31f68276d063adc2677918aad8b41f"},{url:"/assets/visitor_management/frontend/manifest.webmanifest",revision:"65dfae982e09fab3abac6a145f5e67a7"}],{}),e.cleanupOutdatedCaches(),e.registerRoute(({request:e,url:n})=>"navigate"===e.mode&&n.pathname.startsWith("/vms"),new e.NetworkFirst({cacheName:"vms-pages",networkTimeoutSeconds:5,plugins:[new e.ExpirationPlugin({maxEntries:16,maxAgeSeconds:86400})]}),"GET"),e.registerRoute(({url:e})=>e.pathname.startsWith("/api/"),new e.NetworkFirst({cacheName:"vms-api",networkTimeoutSeconds:8,plugins:[new e.ExpirationPlugin({maxEntries:64,maxAgeSeconds:3600})]}),"GET"),e.registerRoute(({url:e})=>e.pathname.startsWith("/assets/visitor_management/frontend/")&&!e.pathname.endsWith(".png")&&!e.pathname.endsWith(".svg")&&!e.pathname.endsWith(".woff2"),new e.NetworkFirst({cacheName:"vms-shell",networkTimeoutSeconds:4,plugins:[new e.ExpirationPlugin({maxEntries:48,maxAgeSeconds:86400})]}),"GET")});


// GatePass Web Push (VAPID) — appended by copy-pwa
self.addEventListener("push", (event) => {
	let data = { title: "Visitor Gate", body: "Visitor approval needed.", url: "/vms/approvals?tab=pending" };
	try {
		if (event.data) Object.assign(data, JSON.parse(event.data.text()));
	} catch {
		/* defaults */
	}
	event.waitUntil(
		self.registration.showNotification(data.title, {
			body: data.body,
			icon: data.icon || "/assets/visitor_management/frontend/icons/icon-192.png",
			badge: data.badge || "/assets/visitor_management/frontend/icons/icon-192.png",
			tag: data.tag || "vms-host-alert",
			renotify: true,
			requireInteraction: true,
			data: { url: data.url },
			vibrate: [280, 120, 280, 120, 420],
		}),
	);
});

self.addEventListener("notificationclick", (event) => {
	event.notification.close();
	const target = event.notification.data?.url || "/vms/approvals?tab=pending";
	event.waitUntil(
		clients.matchAll({ type: "window", includeUncontrolled: true }).then((windowClients) => {
			for (const client of windowClients) {
				if (client.url.includes("/vms") && "focus" in client) {
					client.navigate(target);
					return client.focus();
				}
			}
			if (clients.openWindow) return clients.openWindow(target);
		}),
	);
});
