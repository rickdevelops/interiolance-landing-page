# INTERIOLANCE portfolio carousel and upload manager

The homepage and **Our Work** page share a responsive carousel. It displays up to 10 published projects in the manually saved order. In `admin.html`, the client can drag projects into position or use the up/down arrows; the first row is the first project shown publicly. New uploads are appended to the end until reordered. No HTML editing or code commit is needed for routine portfolio updates.

## One-time setup (Supabase)

The current site is static hosting, so it needs a small hosted service to store image files and project details for every visitor. Supabase provides that storage. Once configured, the normal workflow is: open `/admin.html`, sign in, choose a project image and details, then select **Upload & publish project**.

1. Create a project at [supabase.com](https://supabase.com/).
2. In **Project Settings → API**, copy the **Project URL** and **anon/public key**. In `project-config.js`, put them in `url` and `anonKey`. The anon key is designed to be visible in a website; **never** use the `service_role` key in browser code.
3. In **SQL Editor**, run the complete SQL below.
4. In **Storage**, create a bucket named `project-images`. Set it to **Public**, set the file size limit to **8 MB**, and allow `image/jpeg`, `image/png`, and `image/webp`.
5. In **Authentication → Users**, create an account for the site administrator. Keep public sign-ups disabled; the manager page only offers sign-in and doesn't expose a registration form.
6. Publish the updated website. Open `admin.html`, sign in with the administrator account, and upload the actual completed project photos. The carousel updates from the database on the next page load.

## Updating an already-configured Supabase project

If the portfolio already works and you are deploying this manual-sort update, run this one-time migration in **Supabase → SQL Editor** before publishing the updated website. It adds the ordering column and initially places existing projects in their current newest-first order. It does not delete project rows or image files.

```sql
alter table public.projects add column if not exists sort_order integer;
with ranked_projects as (
  select id, row_number() over (order by created_at desc nulls last, id) - 1 as position
  from public.projects
)
update public.projects p
set sort_order = ranked_projects.position
from ranked_projects
where p.id = ranked_projects.id and p.sort_order is null;
alter table public.projects alter column sort_order set default 0;
update public.projects set sort_order = 0 where sort_order is null;
alter table public.projects alter column sort_order set not null;
```

## SQL schema and access policies

```sql
create extension if not exists pgcrypto;

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category text not null default 'Interior Design',
  description text not null default '',
  image_url text not null,
  image_path text not null,
  image_alt text not null default '',
  is_published boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

-- Migration for an existing projects table: add and backfill the manual display order.
alter table public.projects add column if not exists sort_order integer;
with ranked_projects as (
  select id, row_number() over (order by created_at desc nulls last, id) - 1 as position
  from public.projects
)
update public.projects p
set sort_order = ranked_projects.position
from ranked_projects
where p.id = ranked_projects.id and p.sort_order is null;
alter table public.projects alter column sort_order set default 0;
update public.projects set sort_order = 0 where sort_order is null;
alter table public.projects alter column sort_order set not null;

alter table public.projects enable row level security;
grant select on public.projects to anon, authenticated;
grant insert, update, delete on public.projects to authenticated;

drop policy if exists "Anyone can view published projects" on public.projects;
create policy "Anyone can view published projects"
  on public.projects for select to anon
  using (is_published = true);

drop policy if exists "Signed-in admins can view all projects" on public.projects;
create policy "Signed-in admins can view all projects"
  on public.projects for select to authenticated
  using (true);

drop policy if exists "Signed-in admins can add projects" on public.projects;
create policy "Signed-in admins can add projects"
  on public.projects for insert to authenticated
  with check (true);

drop policy if exists "Signed-in admins can update projects" on public.projects;
create policy "Signed-in admins can update projects"
  on public.projects for update to authenticated
  using (true) with check (true);

drop policy if exists "Signed-in admins can delete projects" on public.projects;
create policy "Signed-in admins can delete projects"
  on public.projects for delete to authenticated
  using (true);

-- Public website visitors can view public image URLs; only signed-in users can write files.
drop policy if exists "Signed-in admins can upload portfolio images" on storage.objects;
create policy "Signed-in admins can upload portfolio images"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'project-images');

drop policy if exists "Signed-in admins can update portfolio images" on storage.objects;
create policy "Signed-in admins can update portfolio images"
  on storage.objects for update to authenticated
  using (bucket_id = 'project-images')
  with check (bucket_id = 'project-images');

drop policy if exists "Signed-in admins can delete portfolio images" on storage.objects;
create policy "Signed-in admins can delete portfolio images"
  on storage.objects for delete to authenticated
  using (bucket_id = 'project-images');
```

> Security note: these write policies treat Supabase-authenticated users as portfolio administrators. Do not create public signup accounts for this project. If you need several users with different permissions, replace these policies with an explicit admin-role check.

## If the order controls do not appear

The manager uses versioned asset URLs so browsers re-fetch the updated JavaScript and CSS after deployment. After replacing the files and pushing the commit, reload `admin.html`. The list should show an **Order** number and **Move up** / **Move down** buttons beside each project. If an order save fails, read the status message below the list; the administrator must have update permission for `public.projects`, and the `sort_order` column must exist.

## How the manager works

- Every upload creates a database record and stores the image in Supabase Storage.
- The public carousel loads at most 10 published projects sorted by `sort_order` (ascending). The first row in the manager is the first card shown publicly.
- You can drag and drop rows or use the up/down arrow buttons to set the order. Saving updates `sort_order` in Supabase; no website code commit is needed. New uploads are appended after the current last project.
- Uploaded projects replace the sample inspiration cards automatically; no code change is needed for later uploads.
- The manager can edit a project's title, category, description, accessibility text, and image directly in the browser. A replacement image is uploaded first; after the project record is updated, the previous image is removed on a best-effort basis.
- The manager can also remove projects. This deletes the project record and attempts to remove its image file as well.
- Until Supabase is configured and actual project photos are uploaded, the website uses clearly labelled sample inspiration imagery. Those samples are not presented as completed client projects.

## Local preview

Because the site uses browser modules and remote requests, preview through a local static server (for example `python3 -m http.server 8080`) instead of opening the HTML file directly. Visit `http://localhost:8080` and `http://localhost:8080/admin.html`.
