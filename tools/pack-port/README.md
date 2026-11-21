# MIDGARD 5: Kompendien für Foundry V14

Diese Konvertierung ist auf die fünf in V0.07 deklarierten NeDB-Kompendien
aus Commit b4d049c03dc9e05c75526a8ba1e50610e8adf6e5 zugeschnitten. Sie
prüft die SHA-256-Werte und arbeitet mit temporären Kopien; Quellpakete
und bereits vorhandene Zielpakete werden nicht überschrieben. Die zwei
nicht registrierten .db-Dateien sind keine Eingaben der Konvertierung.

Voraussetzungen: Node.js 22+ (geprüft mit Node 24) und npm, voller Checkout
einschließlich vorhandener Karten-Assets und der fünf unveränderten .db-Dateien.

    cd tools/pack-port
    npm ci --ignore-scripts
    npm test
    npm run build

Optional: node build.mjs REPO-ROOT LEERES-OUTPUT-PACKS-VERZEICHNIS .
Ein erneuter Aufbau braucht ein separates oder leeres Ziel. Für ein
Installations-ZIP die fünf erzeugten LevelDB-Verzeichnisse samt den
bestehenden Assets und dem Systemcode einpacken, nicht die alten .db-Dateien
oder das Buildwerkzeug. Die LevelDB-internen Verwaltungsdateien können
zwischen zwei Builds variieren; der Inhalt wird nach jedem Build über
den offiziellen CLI-Export zurückgelesen und strukturell verglichen.

Die Portierung erhält die Dokument- und Tabellenergebnis-IDs sowie
die vorhandenen Würfelbefehle, verknüpft Krit-Makros über feste Tabellen-IDs,
überführt alten Tokenzustand in prototypeToken und erhält Kartenbilder als
Hintergrund der eingebetteten V14-Szenenebene. Formularverhalten und
Darstellung in einer echten isolierten Foundry-V14-Testwelt sind von den
automatischen Speicher- und Makrotests zu unterscheiden.

Referenz: https://github.com/foundryvtt/foundryvtt-cli#api
