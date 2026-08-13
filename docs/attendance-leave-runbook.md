# Attendance and Leave Runbook

## First setup

1. Deploy the matching attendance-enabled backend and frontend together.
2. Run the backend attendance foundation migration once with `--apply`.
3. Ask all existing CMS users to sign in again.
4. In **Staff Accounts**, enable attendance for three to five pilot employees, assign an employee code and joining date, and set a temporary password.
5. Each employee signs in at `/employee`, changes the temporary password, and creates a private six-digit kiosk PIN.
6. In **Attendance & Leave Settings**, generate a tablet enrollment code.
7. Open `/kiosk` on the office Android tablet and enter the code within ten minutes.
8. Install the kiosk page from Chrome if desired and enable Android screen pinning.

## Daily owner workflow

- Open **Attendance** to review presence, field work, leave, lateness, incomplete records, and missing punch-outs.
- Open **Requests** to decide leave, monthly off-day, correction, overtime, and GPS-exception requests.
- Check **Team Calendar** before assigning or approving dates.
- Create outdoor work in **Field Assignments** before the shoot date.

## Common support actions

- Forgotten login password: use **Staff Accounts → Reset password**.
- Forgotten kiosk PIN: use **Staff Accounts → Reset kiosk PIN**; the employee creates a replacement from their profile.
- Lost or replaced tablet: revoke it immediately in **Attendance & Leave Settings**, then enroll the replacement.
- Missed punch: the employee submits a correction; the owner approves or rejects it with a comment.
- Failed field GPS: the punch is saved under **Requests → GPS review** rather than discarded.

## Month end

1. Resolve outstanding corrections, GPS exceptions, overtime, leave, and off-day requests.
2. Open **Attendance Reports** and review the unresolved count.
3. Download the monthly CSV. No paid storage or spreadsheet service is involved.

## Privacy

- Never ask employees to share their kiosk PIN.
- Do not use the kiosk for an owner CMS session.
- Location is collected only during an assigned field punch; background tracking is not used.
- Do not copy credentials, exact coordinates, or leave reasons into logs or public messages.
