# Roux-Pfad – Lektionstexte (Entwurf)

> Arbeitsdokument. Wir schreiben hier Lektion für Lektion aus; die Überführung in `lessons.json` passiert erst, wenn Ton und Struktur stehen. Voraussetzung für diesen Pfad: der abgeschlossene Beginner-Pfad.

---

## Lektion 1: Quer gedacht – und ein neuer Buchstabe

**Ziel-Bild:** Würfel von schräg vorn, die linke und rechte 1x2x3-Säule farbig hervorgehoben, der mittlere Streifen (oben plus Mittelscheibe) ausgegraut. Bildunterschrift: „Zwei Blöcke bauen, dann aufräumen, was in der Mitte übrig bleibt."

```cube-net
...
...
...
... ... ... ...
bbb r.r ggg o.o
bbb r.r ggg o.o
w.w
w.w
w.w
:Links und rechts je ein 1x2x3-Block – der graue Streifen dazwischen bleibt erst mal, wie er ist
```

### Warum überhaupt anders?

Die Ebene-für-Ebene-Methode kennst du. Roux (sprich „Ruh", ist Französisch) macht etwas anderes: Statt Ebenen baust du **Blöcke** auf der linken und rechten Seite und räumst dann auf, was in der Mitte übrig bleibt.

Warum der Aufwand? Weil Roux größtenteils *intuitiv* ist. Weniger Algorithmen zum Auswendiglernen, mehr echtes Selbst-Rausfinden. Es fühlt sich weniger an wie ein Gedicht aufsagen und mehr wie ein Puzzle lösen – was es ja auch ist. Perfekt für Casuals.

Faire Warnung: Der erste Block fühlt sich ein paar Tage lang seltsam an. Das liegt nicht daran, dass du schlecht bist – das ist einfach Roux. Bleib dran, es lohnt sich.

### Zwei neue Vokabeln

Die Notation kennst du aus dem Beginner-Pfad – R, U, F, D, L, Apostroph, Zwei, alles wie gehabt. Roux bringt genau zwei neue Vokabeln mit:

- **M** – die mittlere senkrechte Scheibe zwischen L und R. Gedreht wird sie in dieselbe Richtung wie ein **L**-Zug: Die Oberseite der Scheibe kommt auf dich zu.
- **r** – kleingeschrieben heißt: die rechte Seite **plus** die mittlere Scheibe zusammen.

M-Züge sind das Herz von Roux. Am Anfang fühlen sie sich sperrig an – dein Handgelenk kriegt das hin. Und genau das ist die Scheibe, um die es geht – die Spalte, die zwischen deinen beiden Blöcken frei bleibt:

```cube-net
.y.
.y.
.y.
... .r. ... .o.
... .r. ... .o.
... .r. ... .o.
.w.
.w.
.w.
:Die M-Scheibe: oben herum, vorn herunter, unten herum, hinten wieder hoch
```

### Übung

1. Führe auf dem gelösten Würfel aus: **M2** und wieder **M2**. Dann **M U M' U'** und rückwärts zurück (**U M U' M'**). Gelöst? M sitzt.
2. Führe einmal **r** und einmal **R** direkt hintereinander aus und schau dir den Unterschied an. Danach rückwärts zurück.
3. Zeige mit dem Finger die beiden Bereiche, die du in Lektion 2 und 3 bauen wirst: linkes Drittel ohne Oberseite, rechtes Drittel ohne Oberseite.

**Abhaken, wenn:** Du M und r sicher von L und R unterscheidest und die Drehrichtung von M nicht mehr nachschlagen musst.

---

## Lektion 2: Der erste Block

**Ziel-Bild:** Würfel mit fertigem 1x2x3-Block links (Center, zwei Kanten, unten die Ecken-Kanten-Reihe), Rest chaotisch. Bildunterschrift: „Das linke Drittel, minus Oberseite. Null Algorithmen."

```cube-net
...
...
...
... ... ... ...
bbb r.. ... ..o
bbb r.. ... ..o
w..
w..
w..
:Der linke Block steht – der ganze Rest darf noch Chaos sein
```

### Was gebaut wird

Bau einen **1x2x3-Block auf der linken Seite** – also das linke Center, die zwei linken Kanten (vorne und hinten), plus die Kanten und Ecken unten links. Kurz gesagt: das komplette linke Drittel des Würfels, minus die oberste Ebene.

Klassischer Startpunkt: blaues Center links, Weiß unten. Aber ehrlich – nimm, welche Farben du magst.

### So gehst du vor

Hierfür gibt es **keinen Algorithmus**. Null. Du baust einfach – und das Denken in Teilen aus Beginner-Lektion 1 ist genau das Werkzeug dafür:

- Fang mit dem „Quadrat" an: Center + eine Kante + das Ecke/Kante-Paar darunter. Von da erweiterst du.

```cube-net
...
...
...
... ... ... ...
.bb r.. ... ...
.bb r.. ... ...
w..
w..
...
:Das Quadrat: Center, die Kante nach vorn und das Ecke/Kante-Paar darunter
```

- Halte den fertigen Teil links und **aus dem Weg** – dir bleibt der ganze Rest des Würfels (R-, r-, M- und U-Züge), ohne ihn zu zerstören.
- Langsam ist okay. Zehn Sekunden auf den Würfel starren, bevor du ziehst, ist okay. Das *ist* die Methode.

### Übung

1. Baue nur das Quadrat (Center + Kante + Paar darunter). Dreimal, aus drei verschiedenen Verdrehungen.
2. Erweitere das Quadrat zum vollen 1x2x3-Block. Dreimal. Nicht auf Zeit – auf sauber.
3. Baue den Block einmal mit anderen Farben (z. B. Rot links). Gleiche Logik, neues Gefühl.

**Abhaken, wenn:** Du aus jeder Verdrehung einen kompletten linken 1x2x3-Block baust, ohne festzustecken.

---

## Lektion 3: Der zweite Block

**Ziel-Bild:** Würfel mit beiden Seitenblöcken fertig, in der Mitte und oben ein chaotischer Streifen. Bildunterschrift: „Sieht falsch aus. Ist richtig."

```cube-net
...
...
...
... ... ... ...
bbb r.r ggg o.o
bbb r.r ggg o.o
w.w
w.w
w.w
:Beide Blöcke stehen – oben und in der Mitte bleibt ein grauer Streifen übrig
```

### Dasselbe, gespiegelt – mit Handschellen

Jetzt dasselbe auf der **rechten Seite**: ein 1x2x3-Block, mit derselben Farbe unten, logisch (wenn Weiß deine Unterseite ist, bleibt Weiß unten).

```cube-net
...
...
...
... ... ... ...
... ..r ggg o..
... ..r ggg o..
..w
..w
..w
:Derselbe Block, gespiegelt – und der linke bleibt dabei unangetastet
```

Der Haken: Ab jetzt darfst du die linke Seite **nicht mehr anfassen**. Deine Werkzeuge sind **R, r, M und U** – das reicht wirklich, und nach einer Weile fühlt es sich richtig bequem an.

### So gehst du vor

- Nutze **M** und **U**, um Teile herumzufahren, und **R** und **r**, um sie einzusetzen.
- Steckt ein Teil, das du brauchst, im rechten Block selbst fest? Mit einem R-Zug rausholen, oben sortieren, richtig wieder einsetzen. Rauswerfen durch Reinsetzen – der alte Trick aus dem Beginner-Pfad, nur mit neuen Zügen.

Wenn du fertig bist, sieht der Würfel halb gelöst aus, mit einem chaotischen Streifen oben und in der Mitte. Sieht falsch aus. Ist richtig.

### Übung

1. Baue den zweiten Block – und zwar wirklich nur mit R, r, M und U. Wenn deine linke Hand zuckt: einmal tief durchatmen. Dreimal.
2. Kompletter Durchlauf: erster Block, zweiter Block. Zweimal, mit Ruhe.
3. Fahre ein Teil einmal absichtlich mit M und U einmal komplett um den Würfel herum, bevor du es einsetzt. Nur um zu spüren, wie viel Bewegungsfreiheit dir bleibt.

**Abhaken, wenn:** Du beide Blöcke aus jeder Verdrehung baust – und beim zweiten die linke Seite nicht mehr anrührst.

---

## Lektion 4: Die oberen Ecken – alte Bekannte

**Ziel-Bild:** Würfel mit beiden Blöcken und gelösten oberen Ecken; die Kanten der Oberseite und die Mittelscheibe sind bewusst chaotisch. Bildunterschrift: „Die Mitte darf tanzen. Nur die vier Ecken zählen jetzt."

```cube-net
y.y
...
y.y
b.b r.r g.g o.o
bbb r.r ggg o.o
bbb r.r ggg o.o
w.w
w.w
w.w
:Die vier oberen Ecken sitzen – die Kanten und die ganze M-Scheibe sind noch grau
```

### Zwei Runden, null neue Züge

Nur noch vier Ecken oben sind ungelöst. Die fixen wir in zwei Runden – und beide Zugfolgen kennst du schon. Gute Nachricht vorweg: **Die mittlere Scheibe kannst du hier komplett ignorieren.** Die M-Kanten spielen noch keine Rolle, der Würfel darf chaotisch aussehen.

### Runde 1: Drehen, bis die obere Farbe oben ist

Dein Werkzeug ist die **Sune** aus Beginner-Lektion 7:

> **Sune** = **R U R' U R U2 R'**

Gleiche Halteregeln wie damals (Beginner-Lektion 7), nur dass „oben" jetzt nicht zwingend Gelb ist, sondern was auch immer deine obere Farbe geworden ist: Zeigt genau eine Ecke ihre obere Farbe nach oben, halte sie **vorne links** und mach eine Sune – und wenn danach wieder nur eine Ecke stimmt, war es der Zwillingsfisch: neu halten, noch eine Sune. Zeigen zwei nach oben, halte den Würfel so, dass die Ecke vorne links ihren Sticker in der oberen Farbe **zu dir** zeigt. Zeigt keine nach oben, halte ihn so, dass dieser Sticker **nach links** zeigt. Hinschauen, wiederholen – maximal drei Sunes und alle vier zeigen nach oben.

In den Bildern steht Gelb stellvertretend für deine obere Farbe – Kanten und Mitte bleiben grau, die dürfen hier noch Chaos sein:

```cube
y . .
. . . . y
. . . . .
. y . . .
. . y
:Der Fisch – eine Sune

. . y
y . . . .
. . . . .
. y . . y
. . .
:Der Zwillingsfisch – zwei Sunes

. . .
. y . y .
. . . . .
. . . . .
y . y
:Zwei Ecken oben – Farbe vorne links zeigt zu dir

. . .
y . . . y
. . . . .
y . . . y
. . .
:Null Ecken oben – Farbe vorne links zeigt nach links
```

### Runde 2: An die richtigen Plätze

Such zwei Ecken nebeneinander, deren Seitenfarben zusammenpassen, und halte sie nach **hinten**. Dann:

> **Der Swap** = **R U R' U' R' F R2 U' R' U' R U R' F'**

Der Zug tauscht die beiden **vorderen** Ecken. Kennst du ihn schon aus dem CFOP-Light- oder 2x2-Pfad? Dann sind es alte Freunde. Falls nicht: Das ist der einzige lange Zug dieses Pfades – mach ihn langsam, Buchstabe für Buchstabe, und beachte den Einstieg: R U R' U'. ROAR war die ganze Zeit da.

```cube
r . r
. y . y .
. . . . .
. y . y .
. . .
:Das passende Paar hinten – der Swap tauscht die zwei vorderen Ecken
```

Nirgendwo ein passendes Paar? Mach die Folge trotzdem einmal, danach hast du eins.

### Übung

1. Löse nach den Blöcken die vier oberen Ecken. Dreimal.
2. Übe den Swap fünfmal isoliert auf dem gelösten Würfel: zweimal hintereinander ausgeführt ist er wieder gelöst – eingebaute Erfolgskontrolle.
3. Kompletter Durchlauf bis hierher: zwei Blöcke, Ecken. Zweimal, mit Ruhe.

**Abhaken, wenn:** Nach den Blöcken alle vier oberen Ecken sitzen – richtig gedreht und am richtigen Platz – und dich das Chaos in der Mitte dabei kaltlässt.

---

## Lektion 5: Die letzten sechs Kanten – das Finale

**Ziel-Bild:** Zwei Würfel nebeneinander. Links: alles gelöst außer sechs Kanten (vier oben, zwei in der Mittelscheibe). Rechts: komplett gelöst. Bildunterschrift: „Nur noch M und U. Nichts kann mehr kaputtgehen."

```cube-net
y.y
...
y.y
b.b r.r g.g o.o
bbb r.r ggg o.o
bbb r.r ggg o.o
w.w
w.w
w.w
:Vorher: alles steht, außer sechs Kanten und der Mitte

yyy
yyy
yyy
bbb rrr ggg ooo
bbb rrr ggg ooo
bbb rrr ggg ooo
www
www
www
:Nachher: gelöst
```

### Der rouxigste Teil überhaupt

Sechs Kanten sind übrig, und du löst sie **nur mit M- und U-Zügen**. Nichts auswendig lernen, hauptsächlich hinschauen. Und das Beste: Mit nur M und U kannst du an den Blöcken und Ecken **nichts dauerhaft kaputt machen**. Schlimmstenfalls bist du wieder da, wo du angefangen hast. Das ist eine Einladung zum Spielen.

Drei kleine Phasen:

### Phase A: Die schlechten Kanten kippen

Eine Kante ist „gut", wenn ihre Ober-/Unterseitenfarbe (z. B. Weiß oder Gelb) nach oben oder unten zeigt. Zeigt sie zur Seite, ist die Kante „schlecht" und muss gekippt werden.

```cube
. . .
. . . . .
. . . . .
. . w . .
. . .
:Gute Kante – Weiß oder Gelb zeigt nach oben

. . .
. . . . .
. . . . .
. . . . .
. w .
:Schlechte Kante – die Farbe zeigt zur Seite
```

Halte schlechte Kanten oben zu dir gerichtet und nutze Züge im Stil von **M' U M'**, um sie paarweise oder zu viert zu kippen. Spiel damit herum – du wirst schnell ein Gefühl dafür entwickeln, welche U-Drehung die nächste schlechte Kante in Position bringt.

### Phase B: Links und rechts oben lösen

Bring die zwei Kanten, die oben links und oben rechts hingehören (direkt neben deine Blöcke), mit M und U an ihren Platz. Sobald sie sitzen, sind Ober- und Unterseite komplett fertig.

### Phase C: Die mittlere Scheibe

Schau auf die Vorderseite: Dreh **M** (vielleicht M2) und **U2**, bis die letzten vier Kanten einrasten. Meistens ist es einfach eine **M2**- oder **M U2 M**-Situation. Du wirst es sehen.

### Der Moment

Nach der letzten M-Drehung liegt ein gelöster Würfel in deinen Händen – und du hast dabei **nie eine Ebene gebaut**. Nimm dir zwei Sekunden. Das ist ein komplett anderer Weg zum selben Ziel, und du bist ihn gerade selbst gegangen.

### Übung

1. Erster Roux-Komplettdurchlauf – so langsam du willst. Kein Timer, keine Eile.
2. Spiel fünf Minuten nur mit M und U auf einem bis Lektion 4 gelösten Würfel. Kippe Kanten, fahre sie herum, bring alles wieder zurück. Das ist die beste Intuitionsübung dieses Pfades.
3. Drei komplette Durchläufe hintereinander. Wo hakt es? Genau da hilft die App später am meisten (Zug antippen, Zeitlupe, Wiederholung).

**Abhaken, wenn:** Du einen kompletten Würfel mit Roux aus jeder Verdrehung lösen kannst, ohne die Anleitung zu öffnen.

---

## Was jetzt?

Lös ihn ein paar Dutzend Mal, und Lektion 2 und 3 verwandeln sich von frustrierend zu richtig gutem Spaß – das Blockbauen ist der Teil, in den sich Roux-Leute verlieben.

Es gibt keinen Grund zur Eile, mehr zu lernen. Aber falls dich irgendwann die Neugier packt: Die schicken Versionen von Lektion 4 (heißt CMLL) und Lektion 5 existieren. Die können warten. Möglicherweise für immer. Das ist hier erlaubt.

Und wer nach dem Quer-Denken Lust auf die Speedcubing-Hauptstraße hat: Der **CFOP-Light-Pfad** wartet mit derselben Recycling-Philosophie – fast alles, was du dort brauchst, können deine Finger schon.
