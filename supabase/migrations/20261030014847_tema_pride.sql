-- Tema Pride 🏳️‍🌈 para a página da festa.
alter table events drop constraint if exists events_tema_valido;
alter table events add constraint events_tema_valido
  check (tema in ('rolezinho', 'neon', 'pastel', 'dourado', 'arcade', 'pride'));
