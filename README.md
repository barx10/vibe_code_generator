# VibeCoding Idea Builder

**VibeCoding Idea Builder** er et enkelt, lokalt verktøy for å generere startklare kode-prosjekter ved hjelp av AI.

## Hvordan bruke

1.  **Åpne `index.html`** i nettleseren din.
2.  (Valgfritt) Legg inn din OpenAI API-nøkkel.
3.  Fyll ut skjemaet med ønsket prosjektbeskrivelse.
4.  Trykk **Generer**.

Verktøyet returnerer komplett kode som du kan lime direkte inn i VS Code for å komme i gang.

## Struktur

-   `index.html`: Hovedfilen for applikasjonen.
-   `style.css`: Styling og designsystem.
-   `script.js`: Applikasjonslogikk og API-kall.

## Personvern

API-nøkkelen din sendes kun direkte til OpenAI sine servere. Ingen mellomlagring på server (dette er en statisk side). Hvis du velger "Lagre lokalt", lagres nøkkelen i `localStorage` i nettleseren din.
