# Beginner-Pfad – Lektionstexte (Entwurf)

> Arbeitsdokument. Wir schreiben hier Lektion für Lektion aus; die Überführung in `lessons.json` passiert erst, wenn Ton und Struktur stehen.

---

## Lektion 1: Lern deinen Würfel kennen

**Ziel-Bild:** Explosionsgrafik des Würfels – die sechs Center bilden ein festes Kreuz in der Mitte, außenrum schweben Kanten und Ecken. Bildunterschrift: „Nur 20 Teile bewegen sich wirklich."

```cube-net
...
.y.
...
... ... ... ...
.o. .g. .r. .b.
... ... ... ...
...
.w.
...
:Nur die sechs Center stehen fest – alles andere darf wandern
```

### Der Würfel lügt dich an

Auf den ersten Blick besteht der Würfel aus 54 kleinen Farbflächen, die wild durcheinanderfliegen. Das ist eine optische Täuschung – und sie ist der Grund, warum sich der Würfel unlösbar anfühlt.

In Wahrheit besteht der Würfel aus nur **26 Teilen**, und die spielen drei völlig verschiedene Rollen. Wenn du die einmal gesehen hast, kannst du sie nie wieder nicht sehen. Nimm deinen Würfel in die Hand, wir gehen sie durch.

### So liest du die Bilder hier

Zwei Sorten Diagramme begleiten dich durch alle Lektionen. Die erste ist der **ganze Würfel** – so wie oben: ein Würfel schräg von vorne. Weil man von einem Würfel immer nur drei Seiten gleichzeitig sieht, steht bei Bedarf ein zweiter daneben, der von hinten unten draufschaut. Zusammen zeigen die beiden alle sechs Seiten. Die zweite Sorte ist die **Draufsicht** von schräg oben auf die Oberseite, bei der die vier Seitenflächen der obersten Ebene nach außen wegkippen. Die kommt ab Lektion 3 dazu.

Wichtig in beiden: **Graue Felder heißen „egal"**. Sie sagen dir nicht, dass da nichts ist – sie sagen, dass dieser Sticker für den gerade besprochenen Schritt keine Rolle spielt.

### Die Center: Sie bewegen sich nie

In der Mitte jeder Seite sitzt ein Teil mit genau **einer Farbe**: das Center. Davon gibt es sechs, und sie sind im Inneren fest miteinander verschraubt. Egal wie wild du drehst: **Das weiße Center bleibt immer gegenüber vom gelben, Rot bleibt gegenüber von Orange, Blau gegenüber von Grün.**

Das heißt: Die Center sind schon gelöst. Immer. Sie verraten dir, welche Farbe jede Seite am Ende haben wird. Wenn du „die weiße Seite" löst, löst du in Wahrheit die Seite, auf der das weiße Center sitzt.

Probier's aus: Halte das weiße Center nach oben und drehe irgendwelche Seiten. Weiß bleibt oben. Der Würfel kann dir viel vormachen – aber nicht hier.

### Die Kanten: Zwei Farben, ein Zuhause

Zwischen zwei Centern sitzt immer eine **Kante** – ein Teil mit genau **zwei Farben**. Davon gibt es zwölf.

Und jetzt der wichtigste Gedanke dieser Lektion: **Die zwei Farben einer Kante gehören zusammen. Für immer.** Es gibt genau eine Kante mit Weiß und Rot – und die hat genau ein Zuhause: den Platz zwischen dem weißen und dem roten Center. Nirgendwo sonst kann sie richtig sein.

Such die weiß-rote Kante an deinem Würfel. Egal wo sie gerade steckt: Du weißt jetzt schon, wo sie hin muss.

### Die Ecken: Drei Farben, ein Zuhause

In den acht Ecken des Würfels sitzen – Überraschung – die **Ecken**: Teile mit genau **drei Farben**. Auch hier gilt: Die drei Farben gehören fest zusammen, und jede Ecke hat genau einen richtigen Platz. Die weiß-rot-blaue Ecke gehört dorthin, wo das weiße, das rote und das blaue Center aufeinandertreffen.

So sieht „Zuhause" aus – hier für die weiß-rote Kante und die weiß-rot-blaue Ecke:

```cube-net
...
...
...
... ... ... ...
... ... ... ...
... ... .rr b..
...
..w
..w
:Beide Teile liegen genau dort, wo ihre Farben auf Center treffen
```

### Der Aha-Moment

Du löst den Würfel nicht, indem du „Farben sortierst". Du löst ihn, indem du **Teile nach Hause bringst** – 12 Kanten und 8 Ecken, eins nach dem anderen. Die Center zeigen dir dabei jederzeit an, wo „Zuhause" ist.

Ab jetzt schaust du nicht mehr auf Sticker. Du schaust auf Teile.

### Übung

1. Benenne die sechs Center-Farben deines Würfels und ihre Gegenüber-Paare (Weiß–Gelb, Rot–Orange, Blau–Grün – bei fast allen Würfeln ist das so).
2. Verdrehe den Würfel kräftig. Finde dann die weiß-blaue Kante und zeige mit dem Finger auf ihr Zuhause.
3. Finde die weiß-rot-grüne Ecke und ihr Zuhause. Nicht lösen – nur finden. Das Finden ist die halbe Miete.

**Abhaken, wenn:** Du kannst zu jedem beliebigen Teil sagen, wo sein Zuhause ist.

---

## Lektion 2: Notation – sechs Buchstaben, fertig

**Ziel-Bild:** Würfel von schräg vorn, jede sichtbare Seite mit ihrem Buchstaben beschriftet (F, R, U), die verdeckten Seiten (B, L, D) als durchscheinende Beschriftung. Bildunterschrift: „Mehr Vokabeln brauchst du nie."

```cube-net
...
...
...
... ... ... ...
... ... ... ...
... ... ... ...
...
...
...
!letters
:Sechs Seiten, sechs Buchstaben – und alle grau, weil es hier um Positionen geht, nicht um Farben
```

### Warum überhaupt Notation?

Weil „dann drehst du die Seite da rechts so nach hinten, ne warte, andersrum" keine Sprache ist, in der man Puzzle löst. Die Würfel-Welt hat sich auf sechs Buchstaben geeinigt – und die schönste Nebenwirkung: Jeder Zug auf dieser Seite lässt sich antippen und im 3D-Würfel abspielen. Die Notation ist eure gemeinsame Sprache.

### Die sechs Seiten

Halte den Würfel ganz normal vor dich. Jede Seite hat einen englischen Namen, und wir benutzen nur den ersten Buchstaben:

- **R** – Right, die rechte Seite
- **L** – Left, die linke Seite
- **U** – Up, die Oberseite
- **D** – Down, die Unterseite
- **F** – Front, die Seite zu dir
- **B** – Back, die Seite von dir weg

Wichtig: Die Buchstaben meinen **Positionen, keine Farben**. F ist immer die Seite, die dich gerade anschaut – egal welche Farbe da ist.

### Die eine Regel

Ein Buchstabe allein heißt: **Dreh diese Seite eine Vierteldrehung im Uhrzeigersinn – so, als würdest du direkt auf diese Seite schauen.**

Das „als würdest du draufschauen" ist der Teil, über den alle einmal stolpern, also nimm den Würfel in die Hand: Für **R** schaust du gedanklich von rechts auf den Würfel – im Uhrzeigersinn heißt dann: die vordere Kante wandert nach oben. Für **L** schaust du von links – deshalb ist L im Uhrzeigersinn genau die Gegenrichtung von R. Fühlt sich am Anfang falsch an, ist aber richtig.

Dazu kommen zwei Zusätze:

- Ein **Apostroph** (gesprochen: „gestrichen") dreht gegen den Uhrzeigersinn: **R'** ist die Rückwärtsversion von R.
- Eine **2** heißt halbe Drehung: **R2** dreht die rechte Seite um 180 Grad – da ist die Richtung dann egal.

Das war die komplette Grammatik. Sechs Buchstaben, ein Strich, eine Zwei.

Und so sieht ein einzelner Zug aus. Links der gelöste Würfel, rechts derselbe Würfel nach genau einem **R** – die rechte Spalte ist einmal rundherum gewandert:

```cube-net
yyy
yyy
yyy
ooo ggg rrr bbb
ooo ggg rrr bbb
ooo ggg rrr bbb
www
www
www
:Vorher: gelöst

yyg
yyg
yyg
ooo ggw rrr ybb
ooo ggw rrr ybb
ooo ggw rrr ybb
wwb
wwb
wwb
:Nachher: ein einziges R
```

### Der Zaubertrick zum Einüben

Zeit für Magie. Nimm den **gelösten** Würfel und führe diese vier Züge aus:

**R U R' U'**

Sieht kaputt aus? Gut. Jetzt mach genau dieselben vier Züge nochmal. Und nochmal. **Insgesamt sechsmal.**

Wenn du sauber gedreht hast, hältst du jetzt wieder einen gelösten Würfel in der Hand. Kein Trick, pure Mathematik – und der Beweis, dass du die Notation kannst.

### Sag Hallo zu ROAR

Diese vier Züge wirst du auf jeder folgenden Seite wiedertreffen – sie sind der Herzschlag der halben Beginner-Methode. Etwas so Wichtiges verdient einen Namen. Merk ihn dir gut, wir werden ihn brauchen:

> **ROAR** = **R U R' U'**

Die Buchstaben sind wörtlich die Notation, das Apostroph fällt beim Rufen unter den Tisch – gesprochen: „roar", wie ein Löwe. Ab hier heißt der Zaubertrick in unseren Lektionen einfach ROAR, und wo es kritisch wird, schreiben wir die Züge zur Sicherheit noch mal dazu.

### Übung

1. Führe auf dem gelösten Würfel aus: **F2 U R' D** – und dann rückwärts wieder zurück: **D' R U' F2**. Gelöst? Notation sitzt.
2. Sechs ROAR (**R U R' U'**) hintereinander, bis der Würfel wieder gelöst ist. Wer sich verzählt, fängt von vorn an – auch das ist Übung.
3. Erkläre jemandem (oder deiner Kaffeetasse) den Unterschied zwischen R und R'.

**Abhaken, wenn:** Du jede Zugfolge aus Buchstaben, Strichen und Zweien ausführen kannst, ohne nachzudenken, welche Seite gemeint ist.

---

## Lektion 3: Die weiße Blume – dein erster Schritt

**Ziel-Bild:** Zwei Würfel nebeneinander. Links: Oberseite mit gelbem Center und vier weißen Kanten drumherum („die Blume"). Rechts: weiße Seite unten mit fertigem weißen Kreuz, die Seitenfarben der Kanten passen zu den Centern. Bildunterschrift: „Erst pflücken, dann pflanzen."

```cube-net
...
...
...
... ... ... ...
.o. .g. .r. .b.
.o. .g. .r. .b.
.w.
www
.w.
:Das Ziel: weißes Kreuz unten, und über jeder Kante steht ihr eigenes Center
```

### Ab hier wird gelöst

Genug Theorie – ab jetzt bringst du Teile nach Hause. Der erste Schritt jeder Lösung ist das **weiße Kreuz**: die vier weißen Kanten an ihrem Platz um das weiße Center, und zwar so, dass ihre zweite Farbe zum jeweiligen Seiten-Center passt.

Und hier kommt die gute Nachricht: Für diesen Schritt gibt es **keinen einzigen Algorithmus**. Das ist reines Puzzeln – genau der Teil, für den du hier bist.

### Warum eine Blume?

Der direkte Weg zum Kreuz ist am Anfang fummelig, weil man sich fertige Kanten ständig wieder kaputt macht. Deshalb der Umweg, der keiner ist:

**Schritt 1 – Blume pflücken:** Halte das **gelbe** Center nach oben. Sammle jetzt alle vier weißen Kanten oben um das gelbe Center herum – weißer Sticker nach oben. Fertig sieht das aus wie ein Gänseblümchen: gelbe Mitte, weiße Blütenblätter.

```cube
. b .
. . w . .
o w y w r
. . w . .
. g .
:Die Blume von oben – die Seitenfarben der Blütenblätter sind noch bunt gemischt
```

Wie du die Kanten nach oben bekommst? Ausprobieren. Ernsthaft – das ist die Aufgabe. Zwei Hinweise, falls du feststeckst: Eine weiße Kante in der mittleren Ebene kommt mit einem Zug der Seite nach oben, in der sie steckt. Und wenn dieser Zug ein schon gepflücktes Blütenblatt wegschubsen würde: Dreh vorher die Oberseite (U), damit ein freier Platz über der Kante liegt.

**Schritt 2 – Blütenblätter pflanzen:** Jetzt kommt der befriedigende Teil. Schau dir ein weißes Blütenblatt an – seine **Seitenfarbe** verrät sein Zuhause. Dreh die Oberseite (U), bis diese Seitenfarbe direkt über dem Center derselben Farbe steht. Rot über Rot, Grün über Grün.

Passt es? Dann dreh diese Seite **zweimal** (also z.B. F2) – und die Kante klappt nach unten, direkt in ihr Zuhause. Weiß landet unten, die Seitenfarbe sitzt am richtigen Center. Ein Blütenblatt gepflanzt.

Das machst du viermal, und unten ist das weiße Kreuz fertig – mit passenden Farben ringsum, nicht nur einem weißen Plus.

### Der Kontrollblick

Dreh den Würfel einmal um: Unten ein weißes Kreuz. Und jetzt der wichtige Blick auf die **Seiten**: An jeder Seitenfläche muss das mittlere Feld der untersten Reihe zum Center passen.

```cube
. b .
. . w . .
r w w w o
. . w . .
. g .
:Zum Kontrollieren umgedreht – weißes Kreuz, jede Seitenfarbe passt zu ihrem Center
```

Wenn ja: sauber gelöst. Wenn irgendwo Rot unter Grün hängt, war die Kante überm falschen Center – kein Drama, hoch damit (Seite zweimal drehen) und richtig neu gepflanzt.

### Übung

1. Verdrehe den Würfel gründlich und baue die Blume. Dreimal.
2. Blume → Kreuz, komplett. Dreimal. Nicht auf Zeit – auf sauber.
3. Königsdisziplin für später: Baue eine Kante direkt ins Kreuz, ohne Umweg über die Blume. Wenn dir das irgendwann bei allen vieren gelingt, hast du den ersten Schritt Richtung CFOP schon in der Tasche.

**Abhaken, wenn:** Du aus jedem verdrehten Würfel ohne Hilfe ein weißes Kreuz mit passenden Seitenfarben baust.

---

## Lektion 4: Die weißen Ecken – der Aufzug

**Ziel-Bild:** Würfel mit weißer Seite nach unten gekippt, weiße Ebene komplett, und ringsum stimmt die unterste Farbreihe. Bildunterschrift: „Ein Drittel geschafft – und du kennst die Züge schon."

```cube-net
...
...
...
... ... ... ...
.o. .g. .r. .b.
ooo ggg rrr bbb
www
www
www
:Erste Ebene komplett: Weiß unten, ringsum eine geschlossene Farbreihe
```

### Dein erster Algorithmus (den du längst kannst)

Jetzt kommen die vier weißen Ecken nach Hause. Dafür brauchst du deinen ersten echten Algorithmus – und hier die Pointe: Es ist **ROAR** (R U R' U'), unser alter Bekannter aus Lektion 2.

Vier Züge, die deine Finger schon können. In dieser Lektion hat ROAR einen zweiten Job: Wir nennen ihn hier auch den **Aufzug**, und gleich siehst du, warum.

### Schritt 1: Finden und parken

Halte den Würfel mit dem weißen Kreuz **nach unten** – so bleibt er jetzt bis zum Ende der Methode. Such in der **oberen Ebene** eine Ecke mit einem weißen Sticker. Ihre zwei anderen Farben verraten ihr Zuhause: Die weiß-rot-grüne Ecke gehört in die Ecke zwischen dem roten und dem grünen Center.

Dreh nur die Oberseite (U), bis die Ecke **genau über ihrem Zuhause** schwebt. Sie steht jetzt sozusagen im obersten Stockwerk und wartet auf den Aufzug.

```cube
. . .
. . . . .
. . . . .
. . . r w
. . g
:Geparkt: die weiß-rot-grüne Ecke wartet vorne rechts oben auf den Aufzug
```

### Schritt 2: Aufzug fahren

Dreh den ganzen Würfel so in deinen Händen, dass das Zuhause der Ecke **vorne rechts unten** liegt (die wartende Ecke also vorne rechts oben). Und jetzt: **ROAR fahren** – R U R' U' – und schau auf die Ecke. Sitzt sie unten, mit Weiß nach unten? Fertig. Wenn nicht: nochmal ROAR. Und nochmal.

Der Aufzug holt die Ecke ab, dreht sie unterwegs ein Stückchen und setzt sie wieder ab – spätestens nach fünf Fahrten steigt sie richtig herum in ihrem Stockwerk aus. Du musst nichts rechnen: fahren, gucken, fahren, gucken.

Das Schöne daran: Solange du die vier Züge immer **komplett** ausführst, fasst der Aufzug nur diesen einen Eckplatz an. Dein Kreuz und die schon gelösten Ecken bleiben, wo sie sind. (Die mittlere Ebene wirbelt er etwas durcheinander – völlig egal, die ist sowieso noch Chaos.)

### Die zwei Klemm-Fälle

**Die Ecke steckt schon unten, aber falsch oder verdreht?** Dann blockiert sie den Aufzugschacht. Die Lösung kennst du: Dreh den Würfel so, dass die Klemm-Ecke vorne rechts unten sitzt, und fahr **einmal ROAR** – schon ist sie oben befreit. Ab da: normales Programm, parken, fahren.

**Der weiße Sticker zeigt nach oben, flach auf der Oberseite?** Kein Sonderfall, nur eine längere Fahrt. Über ihr Zuhause parken, Aufzug fahren wie immer – sie braucht bloß ein, zwei Runden mehr.

```cube
. . .
. . . . .
. . . . .
. . . w r
. . g
:Weiß zeigt flach nach oben – gleiche Routine, nur ein, zwei Fahrten mehr
```

### Übung

1. Löse alle vier weißen Ecken. Dreh danach den Würfel um und genieße den Anblick: eine komplett weiße Seite, und ringsum passt die unterste Reihe zu den Centern. Falls irgendwo die Farben nicht passen, ist eine Ecke im falschen Stockwerk ausgestiegen – befreien und neu parken.
2. Verdrehen, Kreuz, Ecken – die komplette erste Ebene. Dreimal, in Ruhe.
3. Zähl bei einer Ecke mal mit, wie viele ROARs sie braucht. Ein Muster erkennst du vielleicht selbst.

**Abhaken, wenn:** Die erste Ebene sitzt komplett – weiße Fläche unten, passende Farbreihe ringsum – und zwar aus jeder Verdrehung heraus.

---

## Lektion 5: Die mittlere Ebene – der Aufzug bekommt Anbauten

**Ziel-Bild:** Würfel zu zwei Dritteln gelöst, nur die oberste Ebene noch bunt. Bildunterschrift: „Zwei Drittel. Ab hier riecht es nach gelöst."

```cube-net
...
...
...
... ... ... ...
ooo ggg rrr bbb
ooo ggg rrr bbb
www
www
www
:Untere und mittlere Ebene stehen – nur die Oberseite ist noch bunt
```

### Vier Kanten fehlen

Zwischen deiner fertigen weißen Ebene und dem gelben Deckel liegen noch vier Kanten: die der mittleren Ebene. Das Praktische: Keine davon enthält Gelb oder Weiß – du suchst also oben nach Kanten **ohne gelben Sticker**.

### Schritt 1: Das kleine T bauen

Nimm dir eine gelbfreie Kante aus der oberen Ebene. Ihre **vordere Farbe** (die zur Seite zeigt, nicht nach oben) sagt dir, wo es losgeht: Dreh die Oberseite (U), bis diese Farbe über dem **Center derselben Farbe** steht. Grün über Grün – von vorn sieht das aus wie ein kleines **T**.

Jetzt schau auf die Farbe **oben** auf der Kante: Zeigt sie zur Seite, wo ihr Center **rechts** wartet, muss die Kante nach rechts. Wartet ihr Center links, geht's nach links.

```cube
. . .
. . . . .
. . . . .
. . r . .
. g .
:Das kleine T von oben: vorn Grün über dem grünen Center, oben Rot – Rot wartet rechts, also nach rechts
```

### Schritt 2: Einsetzen – zweimal ROAR, leicht frisiert

Beide Einsetzer sind **zwei ROARs hintereinander**: Der erste schiebt die Kante in ihren Slot und leiht dabei kurz eine weiße Ecke aus – der zweite gibt genau diese Ecke wieder zurück. Ausleihen und zurückgeben. Kein Zug ist Magie, jeder hat einen Job.

Der Trick liegt nur in den kleinen Anpassungen: mal beginnt die Sequenz mit U statt R, mal wird mit F statt R gearbeitet – gespiegelt oder gedreht, aber der Rhythmus deiner Finger bleibt der gleiche wie bei ROAR.

Hier die genauen Züge – an dieser Stelle bitte einmal exakt so ausführen und mitzählen:

**Nach rechts:** U R U' R' — U' F' U F

**Nach links:** U' L' U L — U F U' F'

Wenn du magst, sprich beim Üben mit: „ROAR rechts, ROAR vorn" für die Rechts-Version, „ROAR links, ROAR vorn" für die Links-Version. Nach ein paar Durchläufen läuft es von allein.

### Der Klemm-Fall

Eine Kante steckt schon in der mittleren Ebene, aber am falschen Platz oder verdreht? Gleiches Spiel wie beim Aufzug: **rauswerfen durch reinsetzen.** Setz irgendeine gelbfreie Kante von oben an ihre Stelle (mit dem Rechts- oder Links-Einsetzer) – dabei fliegt die Klemm-Kante nach oben und du löst sie ganz normal.

### Übung

1. Setz alle vier Kanten der mittleren Ebene ein. Zwei Drittel des Würfels sind jetzt gelöst – dreh ihn einmal in der Hand und schau dir das an. Du hast das gebaut.
2. Kompletter Durchlauf von verdreht bis hierher: Kreuz, Ecken, mittlere Ebene. Zweimal.
3. Führe den Rechts-Einsetzer einmal in Superzeitlupe aus und beobachte nur die weiße Ecke vorne rechts: raus (erster ROAR), warten, wieder rein (zweiter ROAR). Wenn du das einmal *gesehen* hast, kannst du den Zug nicht mehr vergessen.

**Abhaken, wenn:** Du zwei Drittel des Würfels aus jeder Verdrehung löst und beim Einsetzen weißt, warum der zweite ROAR da ist.

---

## Lektion 6: Das gelbe Kreuz – ROAR bekommt einen Rahmen

**Ziel-Bild:** Blick von oben auf den Würfel: ein gelbes Kreuz (Center plus vier Kanten). Die vier Ecken der Oberseite sind bewusst noch bunt gezeichnet. Bildunterschrift: „Ecken? Ignorieren. Nur das Kreuz zählt jetzt."

```cube
. . .
. . y . .
. y y y .
. . y . .
. . .
:Gelbes Kreuz von oben – die vier Ecken sind hier bewusst grau
```

### Ein Trick, mehrere Anläufe

Die letzte Ebene ist bekannt dafür, dass hier viele Anleitungen anfangen, mit Algorithmen um sich zu werfen. Wir bleiben entspannt: **Wir zerlegen sie in vier kleine Schritte** – einen pro Lektion, jeder mit genau einer Zugfolge. Und eine davon ist schlicht der Aufzug aus Lektion 4, nur andersherum gefahren.

Erste Etappe: das **gelbe Kreuz**. Und zwar wirklich nur das Kreuz – Center plus vier Kanten mit gelbem Sticker nach oben. Was die Ecken gerade tun (falsche Farbe, verdreht, tanzen), interessiert uns in dieser Lektion **null**. Guck einfach an ihnen vorbei.

### Der Blick nach oben

Halte den Würfel so, dass die (noch chaotische) Oberseite mit dem gelben Center oben liegt. Schau nur auf die Sticker der Oberseite und finde heraus, welches der vier Muster du hast:

- **Punkt** – nur das gelbe Center ist gelb, sonst keine gelben Kanten oben.
- **L** – zwei gelbe Kanten oben, die nebeneinander sitzen (ergibt mit dem Center eine Ecke).
- **Linie** – zwei gelbe Kanten oben, die sich gegenüberliegen (ergibt mit dem Center einen Strich).
- **Kreuz** – alle vier gelben Kanten schon oben. Glückwunsch, überspring die Lektion.

```cube
. . .
. . . . .
. . y . .
. . . . .
. . .
:Punkt

. . .
. . y . .
. y y . .
. . . . .
. . .
:L

. . .
. . . . .
. y y y .
. . . . .
. . .
:Linie

. . .
. . y . .
. y y y .
. . y . .
. . .
:Kreuz
```

Egal welches Muster: Es führt genau ein Weg raus.

### Der Zug: ROAR mit F-Rahmen

Der neue Zug ist eigentlich unser alter Freund im Anzug: **ROAR mit F-Rahmen.**

> **F ROAR F'** = **F R U R' U' F'**

Die Idee dahinter ist hübsch: Das F **öffnet eine Klappe** in Richtung Oberseite, dann macht ROAR im Inneren seine übliche Arbeit, und F' **schließt die Klappe** wieder. Was ROAR an der Front angerichtet hat, verschwindet mit F' – nur der nützliche Nebeneffekt bleibt oben stehen: eine gelbe Kante mehr, die nach oben schaut. Deine Finger machen wieder das, was sie können. Neu ist nur der Rahmen drumherum.

### So hältst du den Würfel

**Bei der Linie:** Dreh die Oberseite (U), bis die Linie **waagerecht** vor dir liegt (die zwei gelben Kanten zeigen nach links und rechts). Dann einmal **F ROAR F'** – F R U R' U' F' – und du hast das Kreuz. Fertig.

**Beim L:** Dreh die Oberseite, bis die zwei gelben Kanten nach **oben** und nach **links** zeigen – das L schmiegt sich also in die obere linke Ecke. Einmal **F ROAR F'** – F R U R' U' F' – und du hast … eine Linie. Kein Grund zur Sorge: waagerecht drehen, nochmal denselben Zug, Kreuz.

**Beim Punkt:** Kein Ausrichten nötig, einfach loslegen. Einmal **F ROAR F'** – und du bekommst entweder ein L oder eine Linie. Ab da: siehe oben.

Der Punkt braucht also drei Anwendungen, das L zwei, die Linie eine. Der Zug bleibt der gleiche – der Würfel wird bei jeder Anwendung ein bisschen freundlicher.

### Der häufigste Anfängerfehler

Beim L verwechseln viele die Halterichtung – die zwei gelben Kanten müssen nach **oben und links** zeigen, nicht nach oben und rechts. Falsche Richtung heißt: Der Zug macht das L kaputt, statt es zur Linie zu formen. Falls das passiert: kein Drama, du hast jetzt vermutlich einen Punkt und startest von dort neu.

Kleine Merkhilfe: „L wie Links" – die eine gelbe Kante zeigt nach links, die andere nach hinten (also nach oben in deiner Draufsicht).

### Übung

1. Verdrehe die letzte Ebene absichtlich (irgendein U-Zug), bis du einen Punkt oben hast. Fahr die volle Serie: Punkt → L → Linie → Kreuz. Drei Anwendungen desselben Zugs, ein Gefühl von Kettenreaktion.
2. Kompletter Durchlauf: verdrehen, zwei Ebenen, gelbes Kreuz. Zweimal.
3. Dreh in Zeitlupe einmal **F ROAR F'** und schau, was während des ROAR-Teils an der Front passiert. Sieht wüst aus – und das F' räumt es wieder auf. Genau dieses „Auf-und-wieder-zu" ist das Muster, das dir in der letzten Ebene noch öfter begegnen wird.

**Abhaken, wenn:** Du aus jedem der drei Startmuster in maximal drei Anwendungen ein gelbes Kreuz baust – und dabei den Zug nicht mehr ablesen musst.

---

## Lektion 7: Die Kanten sortieren – zwei tauschen den Platz

**Ziel-Bild:** Blick von oben: das gelbe Kreuz, und über jeder Kante steht ihr eigenes Center. Die vier Ecken sind weiter bunt. Bildunterschrift: „Das Kreuz steht. Jetzt steht es auch richtig."

```cube
. b .
. . y . .
o y y y r
. . y . .
. g .
:Sortiertes Kreuz – jede Kante über ihrem eigenen Center, die Ecken sind noch egal
```

### Ein Kreuz ist noch keine Ordnung

Das gelbe Kreuz aus Lektion 6 sagt bisher nur eines: Alle vier Kanten zeigen ihren gelben Sticker nach oben. **Wo** sie dabei stehen, war uns völlig egal.

Jetzt wird es wichtig. Schau dir die **zweite Farbe** jeder Kante an – die, die zur Seite zeigt. Sie muss über dem Center derselben Farbe stehen: Rot über Rot, Grün über Grün. Genau derselbe Kontrollblick wie beim weißen Kreuz in Lektion 3, nur oben statt unten.

```cube
. b .
. . y . .
g y y y r
. . y . .
. o .
:Hinten und rechts passen. Vorn steht Orange über Grün, links Grün über Orange – die beiden müssen tauschen
```

### Warum jetzt und nicht am Ende

Weil danach niemand mehr an die Kanten rankommt. Die zwei Zugfolgen, die noch fehlen, kümmern sich ausschließlich um die Ecken – die Kanten fassen sie nicht mehr an. Wer sie hier stehen lässt, wie sie gerade stehen, hat am Ende einen Würfel, bei dem alles sitzt außer vier Kanten. Und dann ist es zu spät.

Also: erst die Kanten sortieren, dann die Ecken. Ab hier wird nur noch aufgeräumt.

### Der Zug: eine Sune mit U dran

> **Der Kantentausch** = **R U R' U R U2 R' U**

Der Einstieg ist wieder ein alter Bekannter: **R U R'** ist das halbe ROAR. Dann kommt ein **U** statt des gewohnten U', ein **R U2 R'** – und zum Schluss noch ein einzelnes **U**.

Die ersten sieben Züge haben in der Cubing-Welt einen eigenen Namen: **Sune**, gesprochen „Suh-neh", benannt nach einem schwedischen Cuber. Merk dir den Namen – in den weiterführenden Pfaden ist die Sune ein echter Star. Bei uns hängt ein U hinten dran, und dann macht das Ganze genau eine Sache:

**Die Kante vorne und die Kante links tauschen den Platz.** Mehr nicht.

Naja, fast. Die vier Ecken oben wirbelt der Zug kräftig durcheinander – und das ist Absicht. Die Ecken sind Lektion 8 und 9, die dürfen jetzt noch tanzen. Was bleibt: dein gelbes Kreuz. Guck einfach an den Ecken vorbei, wie schon in Lektion 6.

### So gehst du vor

**Schritt 1 – zwei passende Kanten suchen.** Dreh die Oberseite (U) und zähl bei jeder der vier Stellungen, wie viele Kanten mit ihrer Seitenfarbe über dem richtigen Center stehen. **Es gibt immer eine Stellung, in der mindestens zwei passen.** Das ist keine Redensart und kein Erfahrungswert – das lässt sich beweisen. Such sie, sie ist da.

Passen alle vier: Glückwunsch, überspring die Lektion.

**Schritt 2 – die zwei falschen anschauen.** Jetzt entscheidet sich, wie oft du den Zug brauchst:

- **Die zwei falschen liegen nebeneinander** (über Eck): Dreh den **ganzen Würfel**, bis sie vorne und links liegen. Einmal Kantentausch – fertig.
- **Die zwei falschen liegen sich gegenüber:** Einmal Kantentausch, egal wie du hältst. Danach bist du im Fall darüber und machst normal weiter.

Mehr als zweimal brauchst du den Zug nie.

### Der wichtigste Satz dieser Lektion

Beim Ausrichten in Schritt 2 drehst du **den ganzen Würfel**, nicht die Oberseite. Ein U-Zug würde deine gerade gefundene Stellung wieder zerstören – die zwei passenden Kanten wandern mit.

Die U-Züge *innerhalb* des Kantentauschs sind davon nicht betroffen, die gehören zum Zug und räumen sich selbst wieder auf. Verboten ist nur, zwischendurch von Hand an der Oberseite zu drehen. Diesen Unterschied brauchst du ab jetzt bis zum Schluss.

### Der Kontrollblick

Der schönste dieses Pfades, und er geht ohne Draufsicht: **Dreh den Würfel einmal rundherum und schau die vier Seiten an.** Jede ist jetzt komplett einfarbig – bis auf ihre zwei oberen Ecken.

Wenn das stimmt, sind von 20 Teilen genau vier noch nicht fertig. Und für die gibt es noch zwei Lektionen.

### Übung

1. Bau das gelbe Kreuz und sortier die Kanten. Dreimal. Sag dabei jedes Mal laut, welcher Fall es war: „nebeneinander" oder „gegenüber".
2. Fahr den Kantentausch dreimal hintereinander auf dem **gelösten** Würfel, ohne umzugreifen. Danach ist er wieder gelöst – der Beweis, dass der Zug nichts kaputt macht, was du nicht willst.
3. Kompletter Durchlauf: verdrehen, zwei Ebenen, gelbes Kreuz, Kanten sortiert. Zweimal.

**Abhaken, wenn:** Deine vier Seitenflächen bis auf die oberen Ecken einfarbig sind – und du beim Ausrichten nicht mehr aus Versehen an der Oberseite drehst.

---

## Lektion 8: Das Karussell – die Ecken ziehen um

**Ziel-Bild:** Blick von oben: Die vier Ecken der Oberseite sitzen an ihren richtigen Plätzen, gelb ist oben trotzdem noch nicht alles. Bildunterschrift: „Richtige Adresse, falsche Haltung. Die Haltung ist Lektion 9."

```cube
b b y
o y y r b
o y y y r
g o y g y
y g r
:Jede Ecke steht an ihrem Platz – wie sie dabei gedreht ist, ist hier völlig egal
```

### Andersherum als die meisten Anleitungen

Offen sind nur noch die vier Ecken der Oberseite – deine Kanten sitzen seit Lektion 7. Bei den Ecken gibt es dafür gleich zwei Baustellen auf einmal: Sie stehen an falschen **Plätzen**, und sie sind falsch **gedreht**.

Die meisten Anleitungen drehen zuerst und schieben danach. Wir machen es umgekehrt: **erst der Platz, dann die Drehung.** Das ist kein Detail, das ist der ganze Trick. Wenn die Drehung noch egal ist, darf der Umzugs-Zug die Ecken ruhig verdrehen – und ein Zug, der verdrehen darf, ist viel kürzer als einer, der aufpassen muss.

### Der Zug: das Karussell

> **Das Karussell** = **U R U' L' U R' U' L**

Acht Züge, und der Rhythmus schenkt dir die Hälfte: **U R U' L'** – und dann noch einmal derselbe Takt, nur mit gestrichenem R und ungestrichenem L: **U R' U' L**. Einmal hin, einmal her, fertig.

Der Name kommt von dem, was passiert: Drei Ecken fahren im Kreis, eine steht still. Die stillstehende ist deine **Ankerin**, und sie gehört nach **vorne rechts** oben.

(In der Cubing-Welt heißt der Zug „Niklas" – schlicht nach einem Cuber benannt, der ihn populär gemacht hat. Sowas machen die dort gern.)

### Die Ankerin finden

„An ihrem Platz" heißt: Alle drei Farben der Ecke passen zu den drei Centern, zwischen denen sie sitzt. **Wie sie gedreht ist, spielt keine Rolle** – sie muss nur am richtigen Ort sein.

```cube
. . .
. . . . .
. . . . .
. . . g y
. . r
:Vorne rechts sitzt die gelb-grün-rote Ecke zwischen Grün und Rot – also zu Hause. Dass Gelb zur Seite zeigt, stört hier niemanden.
```

Und hier gilt die Regel aus Lektion 7 weiter, ab jetzt bis zum Ende: **Dreh nicht die Oberseite. Dreh den ganzen Würfel.** Ein U-Zug von Hand würde deine sortierten Kanten wieder verschieben. (Die U-Züge im Karussell selbst sind wie immer erlaubt – der Zug räumt hinter sich auf.)

Das macht das Zählen sogar einfacher, denn wenn du den ganzen Würfel drehst, ändert sich nichts daran, welche Ecke zu Hause ist. Es gibt nur drei Fälle:

- **Genau eine Ecke zu Hause** – der Normalfall. Ankerin nach vorne rechts, Karussell fahren.
- **Vier Ecken zu Hause** – nichts zu tun, weiter zu Lektion 9.
- **Keine Ecke zu Hause** – einmal Karussell in irgendeiner Halterichtung. Danach ist garantiert eine zu Hause, ab da normales Programm.

**Zwei oder drei Ecken zu Hause gibt es nach Lektion 7 nicht.** Wenn du das siehst, ist vorher ein Zug verrutscht – geh zurück und prüfe dein sortiertes Kreuz.

### Fahren und gucken

Ankerin vorne rechts oben, dann einmal **U R U' L' U R' U' L**. Danach hinschauen:

- Alle vier Ecken zu Hause? Fertig.
- Immer noch nur eine? Dann sind die drei anderen in die falsche Richtung gefahren – **noch einmal dasselbe Karussell, gleiche Ankerin, gleiche Haltung.** Jetzt passt es.

Mehr als drei Fahrten braucht kein Würfel, meistens sind es ein oder zwei.

### Der Kontrollblick

Alle vier oberen Ecken stehen zwischen den richtigen Centern. Die Oberseite sieht dabei vermutlich bunter aus als vorher, Gelb zeigt kreuz und quer. **Das ist Absicht und ein gutes Zeichen** – das Karussell verdreht die Ecken beim Umziehen, und genau das darf es. Aufgeräumt wird in Lektion 9.

Was dagegen unverändert stehen muss: dein sortiertes Kreuz aus Lektion 7 und die zwei fertigen Ebenen darunter. Das Karussell fasst von den Kanten keine einzige an. Falls da etwas fehlt, ist unterwegs ein Zug verrutscht – zurück auf Anfang der Lektion, das passiert allen.

### Übung

1. Verdrehe die letzte Ebene absichtlich, bau das gelbe Kreuz, sortier die Kanten und stell dann die Ecken an ihre Plätze. Dreimal, in Ruhe.
2. Fahr das Karussell auf dem **gelösten** Würfel dreimal hintereinander, ohne umzugreifen. Er ist danach wieder gelöst – eingebaute Erfolgskontrolle, und ein gutes Gefühl dafür, dass der Zug nichts kaputt macht.
3. Übe nur den Blick: Würfel in der Hand rundherum drehen und laut sagen, welche Ecke zu Hause ist. Das Finden ist die eigentliche Arbeit dieser Lektion, nicht der Zug.

**Abhaken, wenn:** Du aus jeder Ausgangslage die vier oberen Ecken an ihre Plätze bringst – ohne die Oberseite von Hand zu drehen, und ruhig, wenn oben danach bunter aussieht als vorher.

---

## Lektion 9: Der Aufzug fährt in den Keller – und der Würfel ist fertig

**Ziel-Bild:** Zwei Würfel nebeneinander. Links: die Ecken sitzen an ihren Plätzen, zeigen aber noch kreuz und quer. Rechts: komplett gelöst. Bildunterschrift: „Vier Ecken drehen. Das ist alles, was noch fehlt."

```cube
o b y
y b y r b
o y y y r
g o y g y
y g r
:Vorher: jede Ecke am richtigen Platz, aber verdreht – die Kanten sitzen längst

b b b
o y y y r
o y y y r
o y y y r
g g g
:Nachher: jede Seite einfarbig
```

### Der Aufzug kommt zurück

Erinnerst du dich an Lektion 4? Da hat ROAR als **Aufzug** die weißen Ecken nach unten geholt: R U R' U'. Hoch, drehen, runter, zu.

Jetzt fährt derselbe Aufzug in die andere Richtung – in den Keller:

> **Aufzug in den Keller** = **R' D' R D**

Schau dir die Form an: dasselbe Muster wie ROAR, nur eine Ebene tiefer und andersherum. Rechts runter, Keller auf, rechts hoch, Keller zu. Deine Finger brauchen zwei, drei Versuche, dann fühlt es sich an wie ROAR im Spiegel. **Neue Algorithmen in dieser Lektion: keiner.**

### Die eine Regel, die alles trägt

Für diesen ganzen Schritt gilt: **Der Würfel wird nicht mehr in den Händen gedreht.** Gelb bleibt oben, Weiß unten, dieselbe Seite bleibt vorne – egal, was zwischendurch passiert. Bewegt wird nur mit U und mit dem Aufzug selbst.

Ja, genau andersherum als in den letzten beiden Lektionen. Dort war die Oberseite tabu und du hast den ganzen Würfel gedreht – hier ist es umgekehrt, und das hat einen Grund: Deine Oberseite ist innerlich längst fertig. Ecken und Kanten stehen richtig **zueinander**, der ganze Deckel ist nur als Ganzes verdreht. Und weil U genau das tut – den Deckel als Ganzes drehen –, kannst du damit machen, was du willst. Ein einziger U-Zug am Ende räumt alles wieder gerade.

Den Würfel in der Hand zu drehen wäre dagegen jetzt fatal: Der Aufzug baut die unteren Ebenen absichtlich kurz ab und muss sie exakt dort wieder zusammensetzen, wo er sie abgeholt hat.

### So geht's

**Schritt 1 – Ecke anfahren.** Dreh U, bis eine Ecke, deren Gelb noch **nicht** nach oben zeigt, **vorne rechts oben** steht.

**Schritt 2 – Doppelpack fahren.** Fahr den Aufzug **zweimal hintereinander**: R' D' R D R' D' R D. Dann guck auf die Ecke. Gelb oben? Weiter zu Schritt 3. Noch nicht? Noch ein Doppelpack – mehr als zwei braucht keine Ecke.

Für Ungeduldige die Abkürzung: Zeigt das Gelb der Ecke **nach rechts**, reicht ein Doppelpack. Zeigt es **nach vorne, zu dir**, sind es zwei.

```cube
. . .
. . . . .
. . . . .
. . . g y
. . r
:Gelb zeigt nach rechts – ein Doppelpack

. . .
. . . . .
. . . . .
. . . r g
. . y
:Gelb zeigt nach vorne – zwei Doppelpacks
```

**Schritt 3 – weiter zur nächsten.** Dreh **nur U**, bis die nächste Ecke mit falsch zeigendem Gelb vorne rechts steht. Ecken, die schon gelb nach oben zeigen, fährst du einfach vorbei. Dann wieder Schritt 2.

**Schritt 4 – Deckel ausrichten.** Zeigen alle vier Ecken ihr Gelb nach oben, dreh ein letztes Mal U, bis alles zu den Centern passt.

Und jetzt pass auf, was dabei passiert: Es rastet **alles gleichzeitig** ein. Die Ecken, weil Lektion 8 sie an ihre Plätze gestellt hat. Die Kanten, weil Lektion 7 sie sortiert hat und seitdem kein Zug sie mehr angefasst hat. Der ganze Deckel ist ein fertiges Teil, das nur noch aufgesetzt werden muss.

Nach diesem U-Zug liegt ein **gelöster Würfel** in deiner Hand.

### Der Moment, in dem es aussieht, als wäre alles kaputt

Das muss man ehrlich dazusagen: Zwischen den Aufzugfahrten sieht dein Würfel furchtbar aus. Die schöne weiße Seite unten ist zerlegt, die mittlere Ebene auch. Fast alle brechen hier beim ersten Mal ab und drehen zurück.

Tu's nicht. Der Aufzug räumt selbst auf. Solange du

- jeden Aufzug **komplett** fährst (alle vier Züge),
- immer im **Doppelpack**,
- und den Würfel **nicht drehst**,

ist unten in dem Moment alles wieder da, in dem die letzte Ecke ihr Gelb nach oben dreht. Das ist keine Hoffnung, das ist Mathematik.

Und noch ein Trost: **Oben passiert währenddessen gar nichts.** Das sortierte Kreuz bleibt stehen, die anderen drei Ecken bleiben, wo sie sind. Du kannst beim Fahren also einfach nur auf die eine Ecke vorne rechts gucken und den Rest ignorieren.

### Der Moment

Nach dem letzten U-Zug liegt ein komplett gelöster Würfel in deinen Händen. Nimm dir zwei Sekunden. Guck ihn dir an. Das hast **du** gemacht. Nicht abgeschrieben, nicht auswendig gelernt – jeden Zug verstanden.

Wenn das dein erster selbst gelöster Würfel ist: Foto, Chat an eine Person deines Vertrauens, kurz feiern. Wir warten hier.

### Übung

1. Nimm einen **gelösten** Würfel und fahr den Doppelpack dreimal hintereinander – sechs Aufzüge, ohne umzugreifen. Zwischendrin sieht er zerstört aus, am Ende ist er wieder gelöst. Genau diesem Zurückkommen vertraust du gleich.
2. Erster Komplettdurchlauf – so langsam du willst. Kein Timer, keine Eile. Wenn du irgendwo hängst: die Lektion zurückschlagen ist erlaubt und normal.
3. Drei komplette Durchläufe hintereinander. Wo hakt es? Notation vergessen? Halterichtung unsicher? Das sind die Stellen, an denen die App später am meisten hilft (Zug antippen, Zeitlupe, Wiederholung).

**Abhaken, wenn:** Du einen kompletten Würfel aus jeder Verdrehung lösen kannst, ohne die Anleitung zu öffnen.

---

## Was jetzt?

Wenn du hier abhaken kannst, kannst du den Würfel lösen. Herzlichen Glückwunsch – das ist die Ziellinie dieses Pfades, und für viele Menschen bleibt sie es. Völlig okay.

Für alle, die weiter wollen, geht es an dieser Kreuzung in zwei Richtungen:

- **CFOP light** – dieselbe Grundidee, aber mit intuitivem F2L statt getrennter Ebene und Kanten. Die Methode der meisten Speedcuber, radikal für Casuals entschlackt. Ziel: unter zwei Minuten, mit rund zehn Zügen im Kopf.
- **Roux** – der Weg der Ruhe. Zwei Blöcke bauen, dann den Rest. Wenig Auswendiglernen, viel Verstehen. Fühlt sich anders an, und das ist das Schöne.

Beide Pfade nehmen mit, was du hier gelernt hast: die Notation, das Denken in Teilen statt Stickern, ROAR, den F-Rahmen und die Sune. Du fängst nicht bei null an – du fängst bei „ich kann den Würfel lösen" an. Und das ist ein guter Startpunkt.
