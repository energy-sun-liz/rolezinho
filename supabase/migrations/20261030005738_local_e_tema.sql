-- Link da localização da festa (botão "Como chegar") e tema visual de cada festa.

-- Só links de mapas conhecidos: evita que um link qualquer (golpe) apareça para os convidados.
alter table events add column local_link text
  check (
    local_link is null or (
      char_length(local_link) <= 500
      and local_link ~ '^https://((www\.)?google\.[a-z.]+/maps|maps\.google\.[a-z.]+|maps\.app\.goo\.gl|goo\.gl/maps|(www\.)?waze\.com|maps\.apple\.com|maps\.apple)(/|\?|$)'
    )
  );

-- Temas disponíveis (o visual da página da festa para os convidados).
alter table events add constraint events_tema_valido
  check (tema in ('rolezinho', 'neon', 'pastel', 'dourado', 'arcade'));
