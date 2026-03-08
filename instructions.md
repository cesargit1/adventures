

# AdverturesCalendar

## Developer Requirements Document (Concise)

---

## 1. Product Overview

AdverturesCalendar is a web application for discovering, creating, and joining outdoor adventure events using a **map-first** and **calendar-driven** interface.

The platform supports:

* Public browsing
* User accounts
* Adventure hosting
* Free and paid adventures
* Paid promotion of adventures
* Admin moderation and approval

---

## 2. User Roles

* **Guest** – Unauthenticated visitor
* **User** – Authenticated account holder
* **Host** – User who creates and manages adventures
* **Admin** – Platform administrator

**Notes**

* A User signing up for an adventure is not a separate role
* “Paid user” is a capability/state, not a role
* A User may also be a Host
* Admin permissions are additive

---

## 3. Core Pages (Routes)

### Public

* `/` – Landing page (map + filters)
* `/browse` – Browse adventures (map / calendar / list)
* `/adventures/:id` – Adventure details
* `/login`
* `/signup`

### Authenticated

* `/dashboard`
* `/profile/:userId`
* `/profile/edit`
* `/notifications`

### Host

* `/adventures/create`
* `/adventures/:id/edit`
* `/adventures/:id/manage`

### Admin

* `/admin`
* `/admin/users`
* `/admin/adventures`

---

## 4. Adventure Lifecycle & Status

Each adventure must have **one** status at all times:

* **draft** – Created but not submitted for review
* **scheduled** – Submitted and approved but not yet open
* **open** – Approved and accepting signups
* **at_capacity** – Open but full
* **cancelled** – Cancelled by Host or Admin

Status transitions must be enforced.

---

## 5. Functional Requirements

---

### 5.1 Discovery & Browsing

* Landing page uses an **interactive map** as the primary UI
* Adventures are viewable without authentication
* Adventures can be filtered by:

  * State / region
  * Date range
  * Adventure type
  * Difficulty
  * Distance radius
* Adventures display in:

  * Map view
  * Calendar view (day / week / month)
  * List view
* Full-text search across:

  * Adventure titles
  * Descriptions
  * Host profiles

---

### 5.2 Authentication & Sessions

* Users can register via:

  * Email + password
  * OAuth (e.g., Google, Facebook)
* Email verification required
* Login redirects to dashboard
* “Remember Me” enabled with **limited session duration**
* Sessions must expire automatically after a reasonable time of inactivity
* Passwords stored using industry-standard hashing (Argon2 or bcrypt)

---

### 5.3 User Dashboard & Profile

* Dashboard displays:

  * Upcoming adventures
  * Past adventures
  * Notifications
* User profile displays:

  * Bio
  * Adventure history
  * Host rating (if applicable)

---

### 5.4 Adventure Creation (Host)

Hosts can create adventures with the following attributes:

**Required Fields**

* Title
* Activity type (e.g., hiking, camping, climbing)
* Category tags:

  * Faith-based
  * Family-friendly
  * Adults-only
  * Beginner-friendly
  * Advanced
* Date / time / duration
* Location (map-based)
* Difficulty level
* Required gear
* Max capacity
* Cost (free or paid)
* Description

**Host Capabilities**

* Save adventures as draft
* Submit adventures for admin approval
* Edit or cancel adventures
* View signup count
* Remove users from an adventure for safety reasons
* Set participant list visibility:

  * Public (visible on adventure details)
  * Private (visible only to Host and Admin)

---

### 5.5 Adventure Approval (Admin)

* All submitted adventures require **admin approval** before becoming visible
* Admin can:

  * Approve and publish adventures
  * Reject adventures
  * Cancel published adventures
* Only approved adventures can reach **scheduled** or **open** status

---

### 5.6 Joining Adventures

* Users can join:

  * Free adventures with one click
  * Paid adventures via payment flow
* Adventure details page displays:

  * Total spots
  * Spots remaining
* Users can cancel their signup
* Spot count updates automatically
* When capacity is reached, status changes to **at_capacity**

---

### 5.7 Payments & Monetization

* Paid adventures supported
* Platform charges:

  * A percentage-based platform fee on paid adventures
* Hosts can optionally:

  * Pay to promote their adventure for increased visibility
* Payment confirmation required before completing paid signup
* Payment history retained per user

---

### 5.8 Communication & Notifications

* Automated notifications for:

  * Email verification
  * Adventure approval
  * Adventure signup
  * Cancellations
  * Host updates
* Hosts can message all users signed up for an adventure
* Notification history retained per user

---

### 5.9 Ratings & Reviews

* Users can rate and review:

  * Adventures
  * Hosts
* Reviews allowed only after the adventure date
* Ratings contribute to Host reputation

---

## 6. Admin Capabilities

* View and manage users
* View, approve, reject, or cancel adventures
* Enforce platform policies
* Deactivate users or adventures

---

## 7. Non-Functional Requirements

* Navigation elements render in under **0.5 seconds**
* All pages fully interactive within **3 seconds**
* Secure handling of authentication, payments, and user data
* System scales to large datasets

---

## 8. Data & Compliance

* Soft delete only (`is_active` flag)
* User data retained after deactivation
  ⚠️ Retention duration to be finalized (3 vs 5 years)

---

## 9. Out of Scope (Current Version)

* Native mobile apps
* Gear marketplace
* Adventure recommendations
* Offline access

---

### End of Document
 
