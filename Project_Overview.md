# RideBoard - Project Overview & Specification

## 1. Introduction
RideBoard is a scheduled carpooling web application designed to facilitate efficient, safe, and trustworthy ride-sharing. It connects drivers with available seats to riders heading in the same direction.

## 2. Architecture
The application follows a modern full-stack architecture:
- **Frontend**: React.js with Vanilla CSS for styling. State management via Zustand.
- **Backend**: Node.js/Express.js acting as a thin API layer for Supabase.
- **Database**: Supabase (PostgreSQL) with Real-time capabilities, Row Level Security (RLS), and database-level scheduling.
- **Geospatial**: OSRM (Open Source Routing Machine) for route polyline generation and Nominatim for geocoding fallback.

## 3. Actors
- **Driver**: A user who posts rides, specifies departure times, fares, and manages their vehicle capacity.
- **Rider**: A user who searches for rides, books seats, and communicates with drivers.
- **System**: Automated processes for ride expiry, chat notifications, and status updates.

## 4. Key Use Cases
- **Post a Ride**: Drivers can select origin/destination on a map, set time/fare, and publish.
- **Search for Rides**: Riders search by location proximity and time.
- **Book a Ride**: Riders can confirm seats; the system updates availability in real-time.
- **Cancel Booking**: Riders can opt-out; availability is restored, and their chat status reflects the cancellation.
- **Group Chat**: Each ride has a private group chat for the driver and confirmed riders.
- **Trust & Reviews**: Users can rate each other after completed rides to build community trust.
- **Automatic Expiry**: Rides are automatically marked as 'expired' by the database once the departure time has passed.

## 5. Database Schema
### 5.1. Users
| Field | Type | Description |
|---|---|---|
| id | UUID | Primary key (linked to Auth) |
| name | TEXT | Full name of the user |
| email | TEXT | Email address (unique) |
| phone | TEXT | Contact number |

### 5.2. Rides
| Field | Type | Description |
|---|---|---|
| id | UUID | Primary key |
| poster_id | UUID | Reference to driver (Users table) |
| origin_address | TEXT | Human-readable origin |
| destination_address | TEXT | Human-readable destination |
| start_time | TIMESTAMPTZ | Scheduled departure time |
| total_seats | INTEGER | Max capacity (1-8) |
| seats_remaining | INTEGER | Current availability |
| status | TEXT | active, expired, full |

### 5.3. Bookings
| Field | Type | Description |
|---|---|---|
| id | UUID | Primary key |
| ride_id | UUID | Reference to Ride |
| rider_id | UUID | Reference to Rider |
| status | TEXT | confirmed, cancelled |

### 5.4. Messages
| Field | Type | Description |
|---|---|---|
| id | UUID | Primary key |
| ride_id | UUID | Reference to Ride |
| sender_id | UUID | Reference to User |
| content | TEXT | Message text |

## 6. Implementation Details
- **Ride Expiry**: Handled by `pg_cron` in Supabase. A scheduled task runs every minute to update the status of past-due rides.
- **Cancellation Logic**: When a booking is cancelled, the `bookings` status changes. In group chats, messages from cancelled riders display "Cancelled Rider" to maintain history without compromising current ride integrity.
- **Seeding**: The project includes a `seed.js` script to populate the database with future-dated test data for development.
