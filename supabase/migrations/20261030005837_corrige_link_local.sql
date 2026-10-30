-- Corrige a regra do link da localização: a versão anterior aceitava domínios que só
-- COMEÇAM com "google." (ex.: https://google.com.golpe.io/maps). Agora o domínio do
-- Google precisa terminar logo depois da extensão do país (google.com, google.com.br, google.co.uk).
alter table events drop constraint if exists events_local_link_check;
alter table events add constraint events_local_link_check
  check (
    local_link is null or (
      char_length(local_link) <= 500
      and local_link ~ '^https://((www\.)?google\.(com|[a-z]{2})(\.[a-z]{2})?/maps|maps\.google\.(com|[a-z]{2})(\.[a-z]{2})?|maps\.app\.goo\.gl|goo\.gl/maps|(www\.)?waze\.com|maps\.apple\.com|maps\.apple)(/|\?|$)'
    )
  );
