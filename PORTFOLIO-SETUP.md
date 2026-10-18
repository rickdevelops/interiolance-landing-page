# INTERIOLANCE portfolio carousel and upload manager

The homepage and **Our Work** page share a responsive carousel. It displays the latest 10 published projects, newest first. The client can add a project through `admin.html` without editing HTML, uploading assets to GitHub, or making a code commit.

## One-time setup (Supabase)

The current site is static hosting, so it needs a small hosted service to store image files and project details for every visitor. Supabase provides that storage. Once configured, the normal workflow is: open `/admin.html`, sign in, choose a project image and details, then select **Upload & publish project**.

1. Create a project at [supabase.com](https://supabase.com/).
2. In **Project Settings → API**, copy the **Project URL** and **anon/public key**. In `project-config.js`, put them in `url` and `anonKey`. The anon key is designed to be visible in a website; **never** use the `service_role` key in browser code.
3. In **SQL Editor**, run the complete SQL below.
4. In **Storage**, create a bucket named `project-images`. Set it to **Public**, set the file size limit to **8 MB**, and allow `image/jpeg`, `image/png`, and `image/webp`.
5. In **Authentication → Users**, create an account for the site administrator. Keep public sign-ups disabled; the manager page only offers sign-in and doesn't expose a registration form.
6. Publish the updated website. Open `admin.html`, sign in with the administrator account, and upload the actual completed project photos. The carousel updates from the database on the next page load.

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
  created_at timestamptz not null default now()
);

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

## How the manager works

- Every upload creates a database record and stores the image in Supabase Storage.
- The public carousel loads at most 10 published projects in newest-first order.
- Uploaded projects replace the sample inspiration cards automatically; no code change is needed for later uploads.
- The manager can remove projects. This deletes the project record and attempts to remove its image file as well.
- Until Supabase is configured and actual project photos are uploaded, the website uses clearly labelled sample inspiration imagery. Those samples are not presented as completed client projects.

## Local preview

Because the site uses browser modules and remote requests, preview through a local static server (for example `python3 -m http.server 8080`) instead of opening the HTML file directly. Visit `http://localhost:8080` and `http://localhost:8080/admin.html`.
