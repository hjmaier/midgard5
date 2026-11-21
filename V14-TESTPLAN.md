# MIDGARD 5 unter Foundry V14

Arbeitsbasis: Commit `b4d049c03dc9e05c75526a8ba1e50610e8adf6e5` (Branch V0.07).
System-ID, Klassen von Figuren und Gegenständen, vorhandene Pack-Namen und
Asset-Pfade bleiben erhalten. Das Manifest erlaubt V14 und weist erst nach
einem echten Lauf einen verifizierten Build aus. Kein Release- oder Updatekanal
wird auf einen ungetesteten Stand umgestellt.

## Test, bevor das Paket produktiv eingesetzt wird

1. Lokale Node-Tests mit `npm test`; diese testen die Verträge der eigenen
   Module, nicht den Foundry-Server oder dessen Browser-Rendering.
2. In einer isolierten lizenzierten Foundry-Installation 14.370 die fertige
   Systemkopie als `Data/systems/midgard5` einbinden. Eine **neue** Testwelt
   ohne Module anlegen. Server- und Browserfehler prüfen.
3. Spielfigur und NSC anlegen; LP/AP, GW und Bonus vom Standard abweichend
   eintragen. Speichern, Bogen schließen und erneut öffnen; dann zusätzlich
   die Welt neu laden. Am neuen Token beide Balken prüfen und Initiative auf
   die Summe von GW und Bonus vergleichen.
4. Je einen Gegenstand, eine Fertigkeit, Rasse und einen Abenteurertyp öffnen,
   Felder ändern und erneut öffnen. Eingebetteten Gegenstand öffnen und eine
   Testkopie löschen. Ansicht zusätzlich als Spieler mit und ohne Rechte prüfen.
5. Drei Figurenblaupausen, drei Karten, mindestens einen Standardwürfel und
   einen kritischen Wurf prüfen; beim kritischen Wurf muss die richtige Tabelle
   gezogen und veröffentlicht werden.
6. Erst dann eine separate Kopie einer alten Welt prüfen: Szenen, Token,
   Figuren, Items, Journale, Tabellen, Hotbar-Makros und Verknüpfungen. Die
   Originalwelt niemals als erste V14-Testwelt öffnen. Das Paket ändert nicht
   automatisch benutzerdefinierte Makros oder alte Weltdaten.

Die Beschreibungsfelder verwenden Foundrys ProseMirror-Editor. Darstellung,
Speichern und geheime Abschnitte einmal als SL und Spieler prüfen. Als
Spieler eine harmlose Beschreibung mit Fettdruck und Absatz anlegen, speichern,
die Welt neu laden und die Formatierung erneut prüfen, auch auf einem Fahrzeug. Ein Ausbau
der Spielregeln ist nicht Teil dieses Ports. Karten und Icons werden mit ihren bestehenden
Pfaden übernommen; für eine Veröffentlichung die Rechte und die bisherigen
Hinweise erhalten.
## Würfeltabellen unter 0.14.2 prüfen

Für die Prüfung die Tabelle aus dem aktualisierten Kompendium verwenden.
Bereits in die Welt importierte Tabellen sind unabhängige Kopien und
werden durch das neue Paket nicht aktualisiert. Statt eine bearbeitete
Tabelle zu überschreiben, eine separate frische Kopie in einer Testwelt
importieren. Ein Ergebnis von 11–30 bei „Kritische Fehler beim Zaubern“
soll den Ergebnistitel einmal, den Hinweis und die Erklärung als normalen
Text sowie die eingebetteten Würfe anzeigen.
