if(!self.define){let e,n={};const c=(c,i)=>(c=new URL(c+".js",i).href,n[c]||new Promise(n=>{if("document"in self){const e=document.createElement("script");e.src=c,e.onload=n,document.head.appendChild(e)}else e=c,importScripts(c),n()}).then(()=>{let e=n[c];if(!e)throw new Error(`Module ${c} didn’t register its module`);return e}));self.define=(i,a)=>{const r=e||("document"in self?document.currentScript.src:"")||location.href;if(n[r])return;let d={};const s=e=>c(e,r),o={module:{uri:r},exports:d,require:s};n[r]=Promise.all(i.map(e=>o[e]||s(e))).then(e=>(a(...e),d))}}define(["/assets/visitor_management/frontend/workbox-b3c04f83"],function(e){"use strict";self.addEventListener("message",e=>{e.data&&"SKIP_WAITING"===e.data.type&&self.skipWaiting()}),e.precacheAndRoute([{url:"/assets/visitor_management/frontend/vms-chunk-web8.js",revision:"a84e6ad3502502b952dce24a7bda435f"},{url:"/assets/visitor_management/frontend/vms-chunk-web7.js",revision:"65978e1625d0e0ac7d2b567b64ffee48"},{url:"/assets/visitor_management/frontend/vms-chunk-web6.js",revision:"15113eb58455c63ffa59caa75047433d"},{url:"/assets/visitor_management/frontend/vms-chunk-web5.js",revision:"8e50aaa71b185f38ce7dd20d60e59e52"},{url:"/assets/visitor_management/frontend/vms-chunk-web4.js",revision:"5b17898097ad7742a0650864877658be"},{url:"/assets/visitor_management/frontend/vms-chunk-web3.js",revision:"59ae7c93ac325647b734a6c20efe73b7"},{url:"/assets/visitor_management/frontend/vms-chunk-web2.js",revision:"5e271ab4f97c37c6f693cf9bb1f64d8c"},{url:"/assets/visitor_management/frontend/vms-chunk-web.js",revision:"b21b4981d5b4714cb19dae973393c8ef"},{url:"/assets/visitor_management/frontend/vms-chunk-vendor-react.js",revision:"54df785b764cc70116ee3e917eddc565"},{url:"/assets/visitor_management/frontend/vms-chunk-vendor-axios.js",revision:"94c47668a11875922e781fea9cff816d"},{url:"/assets/visitor_management/frontend/vms-chunk-index.js",revision:"41a177f6117ad51892f8478323bd6252"},{url:"/assets/visitor_management/frontend/vms-chunk-capacitor-init.js",revision:"0c8bc9e2c3cb3a13a1a446d0db2cbe6d"},{url:"/assets/visitor_management/frontend/vms-asset-index.css",revision:"802c443ef8dd6904c893e1c9ee24b3f1"},{url:"/assets/visitor_management/frontend/vms-app.js",revision:"a79b35c49e3e404b461088f3606cf1b8"},{url:"/assets/visitor_management/frontend/vite.svg",revision:"e1b5a649812a3640929b2e2a896f7b9a"},{url:"/assets/visitor_management/frontend/manifest.webmanifest",revision:"65dfae982e09fab3abac6a145f5e67a7"},{url:"/assets/visitor_management/frontend/index.html",revision:"3da525f46cb71e980cdef29cdcee447c"},{url:"/assets/visitor_management/frontend/icons/icon-512.png",revision:"ad31f68276d063adc2677918aad8b41f"},{url:"/assets/visitor_management/frontend/icons/icon-192.png",revision:"728a1fb8a8207f499b7bf3756dd5abc1"},{url:"/assets/visitor_management/frontend/icons/icon-180.png",revision:"9eeb300390a1f706b08d1a641c26d6c8"},{url:"/assets/visitor_management/frontend/brand/om-symbol.png",revision:"c20d5178bada101316834f6b8a030a76"},{url:"/assets/visitor_management/frontend/brand/exacuer-logo.png",revision:"5dc00fe4e735747bd0b42f3fdbf9e99f"},{url:"/assets/visitor_management/frontend/brand/exacuer-logo-light.png",revision:"5dc00fe4e735747bd0b42f3fdbf9e99f"},{url:"/assets/visitor_management/frontend/brand/exacuer-logo-dark.png",revision:"5dc00fe4e735747bd0b42f3fdbf9e99f"},{url:"/assets/visitor_management/frontend/brand/exacuer-icon.png",revision:"cf6f0d40961d1907d2cd0acc136c83a7"},{url:"/assets/visitor_management/frontend/brand/exacuer-icon-light.png",revision:"cf6f0d40961d1907d2cd0acc136c83a7"},{url:"/assets/visitor_management/frontend/brand/exacuer-icon-dark.png",revision:"cf6f0d40961d1907d2cd0acc136c83a7"},{url:"/assets/visitor_management/frontend/brand/exacuer-icon-dark.png",revision:"cf6f0d40961d1907d2cd0acc136c83a7"},{url:"/assets/visitor_management/frontend/brand/exacuer-icon-light.png",revision:"cf6f0d40961d1907d2cd0acc136c83a7"},{url:"/assets/visitor_management/frontend/brand/exacuer-icon.png",revision:"cf6f0d40961d1907d2cd0acc136c83a7"},{url:"/assets/visitor_management/frontend/brand/exacuer-logo-dark.png",revision:"5dc00fe4e735747bd0b42f3fdbf9e99f"},{url:"/assets/visitor_management/frontend/brand/exacuer-logo-light.png",revision:"5dc00fe4e735747bd0b42f3fdbf9e99f"},{url:"/assets/visitor_management/frontend/brand/exacuer-logo.png",revision:"5dc00fe4e735747bd0b42f3fdbf9e99f"},{url:"/assets/visitor_management/frontend/brand/om-symbol.png",revision:"c20d5178bada101316834f6b8a030a76"},{url:"/assets/visitor_management/frontend/icons/icon-180.png",revision:"9eeb300390a1f706b08d1a641c26d6c8"},{url:"/assets/visitor_management/frontend/icons/icon-192.png",revision:"728a1fb8a8207f499b7bf3756dd5abc1"},{url:"/assets/visitor_management/frontend/icons/icon-512.png",revision:"ad31f68276d063adc2677918aad8b41f"},{url:"/assets/visitor_management/frontend/manifest.webmanifest",revision:"65dfae982e09fab3abac6a145f5e67a7"}],{}),e.cleanupOutdatedCaches(),e.registerRoute(({request:e,url:n})=>"navigate"===e.mode&&n.pathname.startsWith("/vms"),new e.NetworkFirst({cacheName:"vms-pages",networkTimeoutSeconds:5,plugins:[new e.ExpirationPlugin({maxEntries:16,maxAgeSeconds:86400})]}),"GET"),e.registerRoute(({url:e})=>e.pathname.startsWith("/api/"),new e.NetworkFirst({cacheName:"vms-api",networkTimeoutSeconds:8,plugins:[new e.ExpirationPlugin({maxEntries:64,maxAgeSeconds:3600})]}),"GET"),e.registerRoute(({url:e})=>e.pathname.startsWith("/assets/visitor_management/frontend/")&&!e.pathname.endsWith(".png")&&!e.pathname.endsWith(".svg")&&!e.pathname.endsWith(".woff2"),new e.NetworkFirst({cacheName:"vms-shell",networkTimeoutSeconds:4,plugins:[new e.ExpirationPlugin({maxEntries:48,maxAgeSeconds:86400})]}),"GET")});


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
