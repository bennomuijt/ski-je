# SKI-je v4.2 - automatisch publiceren via GitHub en Cloudflare

## Kan ChatGPT rechtstreeks naar Cloudflare publiceren?

Niet vanuit een gewone chat zonder een geautoriseerde koppeling naar jouw account. Deze projectmap is wél klaar voor het ondersteunde Cloudflare Workers Builds-systeem met GitHub. Na de eenmalige koppeling worden nieuwe commits automatisch gepubliceerd. Dit is een **Worker met statische bestanden en Durable Objects**, dus **niet** als een gewone Cloudflare Pages-ZIP uploaden.

## Eenmalig voorbereiden (bij voorkeur op een pc)

1. Maak een **privé-repository** aan op https://github.com/new, bijvoorbeeld `ski-je`.
2. Pak deze ZIP uit. Upload naar de **hoofdmap van de repository** de inhoud van `SKI-je-Cloudflare-compleet/`: de mappen `src/`, `public/`, `tests/` en de bestanden `package.json`, `wrangler.jsonc`, enzovoort. Upload de omhullende map niet als extra submap, tenzij je de root-directory in Cloudflare juist instelt. Gebruik nooit een geheim of wachtwoord als bestandsnaam of inhoud in GitHub.
3. Log zelf in op https://dash.cloudflare.com/.
4. Ga naar **Workers & Pages -> Create application -> GitHub** (soms heet deze optie **Import a repository**). Koppel jouw GitHub-account en selecteer de repository `ski-je`.
5. Gebruik als Worker/projectnaam **`ski-je`**. Die moet exact overeenkomen met `"name": "ski-je"` in `wrangler.jsonc`.
6. Root directory: de map waar `wrangler.jsonc` staat (bij upload in de repo-hoofdmap: `/`). Deployment/build-opdracht: `npm run deploy` (Cloudflare moet eerst de NPM-dependencies installeren, bijvoorbeeld met `npm install`). Controleer de getoonde instellingen voordat je op **Save and Deploy** drukt.
7. Zet na de eerste geslaagde deployment het geheime **`GROUP_CREATE_SECRET`** in Cloudflare onder **Settings -> Variables and Secrets**. Gebruik een lang, willekeurig wachtwoord en **bewaar dit nooit in GitHub of in deze ZIP**. Beveiliging moet aantoonbaar werken voordat je groepen aanmaakt.
8. Open `https://ski-je.<jouw-subdomein>.workers.dev/api/health`; controleer serverstatus en secrets. Het precieze adres krijg je na publicatie van Cloudflare.
9. Test de groepsfuncties eerst met twee telefoons, daarna met 6 en 20. Controleer GPS-toestemming, verbinding-herstel, batterijverbruik, het verschijnen van oude posities en eventuele datalimieten.

## Updates vanaf ChatGPT (met GitHub verbonden)

Wanneer GitHub in ChatGPT is gekoppeld en de benodigde repository-rechten beschikbaar zijn, kan nieuwe code via GitHub worden voorbereid. Na een commit op de gekoppelde publicatiebranch laat Cloudflare Workers Builds automatisch een nieuwe versie bouwen en publiceren. Je hoeft dan niet elke keer Node.js op een pc te draaien.

**Controleer wijzigingen vóórdat ze op de publicatiebranch komen**, zeker voor GPS, privacy en groepsrechten. Je kunt daarvoor een aparte testbranch en handmatige goedkeuring gebruiken.

## Wat deze versie niet garandeert

- Geen automatische toegang vanuit ChatGPT tot jouw Cloudflare-account.
- Geen gegarandeerde 24/7-verbinding of gegarandeerde achtergrond-GPS in een browser op een vergrendelde telefoon.
- Geen volledige, gecontroleerde SkiWelt-routeberekening zonder geverifieerd piste-/liftnetwerk.
- Gratis capaciteit blijft afhankelijk van het actuele Cloudflare-plan en externe kaart-, webcam- en weerbronnen.

Bron: https://developers.cloudflare.com/workers/ci-cd/builds/
