-- User credits table: tracks try-on credits per user (200 on first access, 100 per try-on)
create table if not exists user_credits (
  user_id uuid primary key references auth.users(id) on delete cascade,
  credits integer not null default 200 check (credits >= 0),
  updated_at timestamptz not null default now()
);

alter table user_credits enable row level security;

-- Users can read their own credits
create policy "users can read own credits"
  on user_credits for select
  using (auth.uid() = user_id);

-- Users cannot directly write credits (service role only)
-- No insert/update/delete policies for anon/authenticated roles

-- Function to initialize credits for a new user (called on first GET)
create or replace function initialize_user_credits(p_user_id uuid)
returns integer language plpgsql security definer as $$
declare
  v_credits integer;
begin
  insert into user_credits (user_id, credits)
  values (p_user_id, 200)
  on conflict (user_id) do nothing;

  select credits into v_credits from user_credits where user_id = p_user_id;
  return v_credits;
end;
$$;

-- Function to deduct credits atomically (returns false if insufficient)
create or replace function deduct_credits(p_user_id uuid, p_amount integer)
returns boolean language plpgsql security definer as $$
declare
  v_credits integer;
begin
  select credits into v_credits from user_credits where user_id = p_user_id for update;

  if v_credits is null then
    -- Initialize with 200, then attempt deduct
    insert into user_credits (user_id, credits) values (p_user_id, 200);
    v_credits := 200;
  end if;

  if v_credits < p_amount then
    return false;
  end if;

  update user_credits
  set credits = credits - p_amount, updated_at = now()
  where user_id = p_user_id;

  return true;
end;
$$;
