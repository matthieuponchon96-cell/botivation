-- =============================================
-- Schema Supabase pour Lettre Motivation App
-- A executer dans le SQL Editor de Supabase
-- =============================================

-- 1. Table des agences d'architecture
create table agencies (
  id uuid default gen_random_uuid() primary key,
  key text unique not null,
  nom_display text not null,
  nom_dirigeant text not null default '',
  civilite text not null default '',
  ville_agence text not null default '',
  specialite text not null default '',
  projet_notable text not null default '',
  ce_qui_attire text not null default '',
  poste text not null default 'architecte collaborateur',
  competence_cle text not null default '',
  created_at timestamptz default now()
);

-- Index pour la recherche
create index agencies_key_idx on agencies (key);

-- RLS: lecture publique (pas besoin d'etre connecte pour chercher une agence)
alter table agencies enable row level security;

create policy "Agencies are publicly readable"
  on agencies for select
  using (true);

-- 2. Table des lettres sauvegardees (liee a l'utilisateur)
create table saved_letters (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  content text not null,
  created_at timestamptz default now()
);

-- RLS: chaque utilisateur ne voit que ses lettres
alter table saved_letters enable row level security;

create policy "Users can read their own letters"
  on saved_letters for select
  using (auth.uid() = user_id);

create policy "Users can insert their own letters"
  on saved_letters for insert
  with check (auth.uid() = user_id);

create policy "Users can delete their own letters"
  on saved_letters for delete
  using (auth.uid() = user_id);
