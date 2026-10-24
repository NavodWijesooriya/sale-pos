# Firebase account approval and data setup

1. Enable Email/Password sign-in in Firebase Authentication and create a web app in the same Firebase project as Firestore.
2. Configure the six `VITE_FIREBASE_*` values from the Firebase web app configuration in your local `.env` file and in **Vercel → Project Settings → Environment Variables** for every deployment environment. These are public browser configuration values; Firestore security rules, not secret client keys, protect account data. Redeploy after changing Vercel environment variables because Vite embeds them at build time.
3. Create a Firestore database for the same Firebase project and deploy this repository's rules:

   ```text
   firebase deploy --only firestore:rules --project YOUR_PROJECT_ID
   ```

4. Register the first administrator through the website's **Create Account** tab. In Firebase Console, find that account's Authentication UID and its `users/{AUTH_UID}` document; set `approvalStatus` to `approved`, then create `userRoles/{AUTH_UID}` with the string field `role: "admin"`. Do not create a shared `admin` identity or let the client edit role documents. The administrator can then review, approve, or reject future requests under **Settings → Pending Approvals & User Accounts**. Regular users do not need a role document.
5. New users register with their Full Name, Business/Dealership Name, Email Address, Password, and Confirm Password. Their Firestore profile is created with `approvalStatus: "pending"`; only an administrator can change it to `approved` or `rejected`. Pending and rejected accounts are restricted from accessing the dealership dashboard and see a dedicated status screen.

The registration request is stored at `users/{AUTH_UID}` with `name`, `businessName`, `email`, `role`, `approvalStatus`, `submittedAt`, `createdAt`, and `updatedAt`. Approval and rejection decisions record `reviewedBy` and `reviewedAt`. Rejected and pending profiles cannot read or write the private dealership data collections, even if the Firebase Authentication account exists.

## Data ownership

Each account's profile and data live under its Authentication UID:

```text
users/{AUTH_UID}
users/{AUTH_UID}/bikes/{bikeId}
users/{AUTH_UID}/settings/preferences
users/{AUTH_UID}/sales/{saleId}
users/{AUTH_UID}/invoices/{invoiceId}
users/{AUTH_UID}/customers/{customerId}
users/{AUTH_UID}/expenses/{expenseId}
users/{AUTH_UID}/products/{productId}
```

The profile document stores account and business identity. Inventory vehicles and settings are stored in `bikes` and `settings/preferences`; sales, invoice snapshots, and customer snapshots are stored in their own subcollections under the same UID. Related sale and customer details are also retained on the vehicle sale record for existing screens and printed invoices. The Firebase client uses Firestore's persistent IndexedDB cache to retain data for offline PWA launches and synchronize changes with Firestore when connected; Firestore remains the source of truth across devices.

Firestore rules authorize profile and business-data access only when the path UID matches `request.auth.uid`. All user data subcollections under `users/{AUTH_UID}` inherit the approved-account check, so the admin role does not grant access to other users' business records.
Only admins can list user profiles, which lets the Settings approval queue show pending, approved, and rejected requests.

## Existing Firestore records

On sign-in, the app copies legacy `bikes` documents whose `ownerUid` matches the signed-in UID into that account's `users/{AUTH_UID}/bikes` collection. It copies the matching `userSettings/{AUTH_UID}` document into `users/{AUTH_UID}/settings/preferences` if that new settings document does not already exist. It also backfills separate sale, invoice, and customer snapshots from existing vehicle sale records without deleting or overwriting existing records. Migration keeps legacy records in place and never overwrites records already in the user's new collection. Legacy reads are owner-only and legacy writes are disabled by the rules.

Legacy records without a verifiable `ownerUid` are deliberately not assigned automatically; review and migrate those with a trusted administrative process. Browser-only backups can still be restored from the account's Settings screen while signed in as the intended owner.
