"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const admin = __importStar(require("firebase-admin"));
process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080';
process.env.GCLOUD_PROJECT = 'existence-ticker-dev';
if (!admin.apps.length) {
    admin.initializeApp({
        projectId: 'existence-ticker-dev'
    });
}
const db = admin.firestore();
async function checkAdminStatus() {
    try {
        console.log("Checking system_settings/global...");
        const globalSettings = await db.collection('system_settings').doc('global').get();
        if (globalSettings.exists) {
            console.log("Global Settings:", JSON.stringify(globalSettings.data(), null, 2));
        }
        else {
            console.log("Global Settings: NOT FOUND");
        }
        console.log("\nChecking all users for admin role...");
        const users = await db.collection('users').get();
        let adminCount = 0;
        users.forEach(doc => {
            const data = doc.data();
            if (data.role === 'admin') {
                console.log(`[ADMIN USER FOUND] ID: ${doc.id}, Name: ${data.name}`);
                adminCount++;
            }
        });
        if (adminCount === 0)
            console.log("No users with role: 'admin' found.");
        // Check for specific super admins collection if it exists
        console.log("\nChecking super_admins collection...");
        const superAdmins = await db.collection('super_admins').get();
        if (superAdmins.empty) {
            console.log("No super_admins documents found.");
        }
        else {
            superAdmins.forEach(doc => {
                console.log(`[SUPER ADMIN DOC] ID: ${doc.id}`);
            });
        }
    }
    catch (error) {
        console.error("Error checking status:", error);
    }
}
checkAdminStatus();
//# sourceMappingURL=check_admin_ts.js.map