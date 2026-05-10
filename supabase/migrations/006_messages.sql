create table public.messages (
  id uuid not null default extensions.uuid_generate_v4 (),
  ride_id uuid not null,
  sender_id uuid not null,
  content text not null,
  created_at timestamp with time zone null default now(),
  constraint messages_pkey primary key (id),
  constraint messages_ride_id_fkey foreign KEY (ride_id) references rides (id) on delete CASCADE,
  constraint messages_sender_id_fkey foreign KEY (sender_id) references users (id)
) TABLESPACE pg_default;

CREATE TABLE public.messages (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ride_id               UUID NOT NULL REFERENCES public.rides(id) ON DELETE CASCADE,
  sender_id             UUID NOT NULL REFERENCES public.users(id),
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  content               TEXT NOT NULL,  
);