// The body figure, drawn for this app from rounded blocks (same feel as the icons).
// Front view on the left, back view on the right.
// class "base" = parts that never light up (head, hands, knees, feet)
// class "m" + data-m = a muscle. data-m must match a key in MUSCLES.
const BODY_SVG = `
<svg viewBox="18 0 154 232" role="img" aria-label="Body map">
  <!-- FRONT -->
  <g transform="translate(5 0)">
    <circle class="base" cx="50" cy="15" r="10"/>
    <rect class="base" x="45" y="24" width="10" height="9" rx="3"/>

    <ellipse class="m" data-m="shoulders" cx="27" cy="42" rx="9" ry="8"/>
    <ellipse class="m" data-m="shoulders" cx="73" cy="42" rx="9" ry="8"/>

    <rect class="m" data-m="chest" x="35" y="36" width="14" height="18" rx="6"/>
    <rect class="m" data-m="chest" x="51" y="36" width="14" height="18" rx="6"/>

    <rect class="m" data-m="biceps" x="19" y="52" width="10" height="24" rx="5"/>
    <rect class="m" data-m="biceps" x="71" y="52" width="10" height="24" rx="5"/>

    <rect class="m" data-m="forearms" x="15" y="79" width="9" height="25" rx="4.500"/>
    <rect class="m" data-m="forearms" x="76" y="79" width="9" height="25" rx="4.500"/>

    <circle class="base" cx="19.500" cy="110" r="4.500"/>
    <circle class="base" cx="80.500" cy="110" r="4.500"/>

    <rect class="m" data-m="core" x="39" y="57" width="10" height="10" rx="4"/>
    <rect class="m" data-m="core" x="51" y="57" width="10" height="10" rx="4"/>
    <rect class="m" data-m="core" x="39" y="69" width="10" height="10" rx="4"/>
    <rect class="m" data-m="core" x="51" y="69" width="10" height="10" rx="4"/>
    <rect class="m" data-m="core" x="39" y="81" width="10" height="11" rx="4"/>
    <rect class="m" data-m="core" x="51" y="81" width="10" height="11" rx="4"/>
    <rect class="m" data-m="core" x="32" y="58" width="5" height="30" rx="2.500"/>
    <rect class="m" data-m="core" x="63" y="58" width="5" height="30" rx="2.500"/>

    <rect class="base" x="34" y="94" width="32" height="11" rx="5.500"/>

    <rect class="m" data-m="quads" x="33" y="107" width="15" height="46" rx="7.500"/>
    <rect class="m" data-m="quads" x="52" y="107" width="15" height="46" rx="7.500"/>

    <circle class="base" cx="40.500" cy="158.500" r="4.500"/>
    <circle class="base" cx="59.500" cy="158.500" r="4.500"/>

    <rect class="m" data-m="calves" x="35" y="165" width="11" height="38" rx="5.500"/>
    <rect class="m" data-m="calves" x="54" y="165" width="11" height="38" rx="5.500"/>

    <rect class="base" x="32" y="205" width="15" height="7" rx="3.500"/>
    <rect class="base" x="53" y="205" width="15" height="7" rx="3.500"/>

    <text class="map-label" x="50" y="229" text-anchor="middle">FRONT</text>
  </g>

  <!-- BACK -->
  <g transform="translate(85 0)">
    <circle class="base" cx="50" cy="15" r="10"/>
    <rect class="base" x="45" y="24" width="10" height="6" rx="3"/>

    <rect class="m" data-m="traps" x="43" y="32" width="14" height="14" rx="4" transform="rotate(45 50 39)"/>

    <ellipse class="m" data-m="shoulders" cx="27" cy="42" rx="9" ry="8"/>
    <ellipse class="m" data-m="shoulders" cx="73" cy="42" rx="9" ry="8"/>

    <rect class="m" data-m="lats" x="34" y="51" width="14" height="31" rx="6"/>
    <rect class="m" data-m="lats" x="52" y="51" width="14" height="31" rx="6"/>

    <rect class="m" data-m="triceps" x="19" y="52" width="10" height="24" rx="5"/>
    <rect class="m" data-m="triceps" x="71" y="52" width="10" height="24" rx="5"/>

    <rect class="m" data-m="forearms" x="15" y="79" width="9" height="25" rx="4.500"/>
    <rect class="m" data-m="forearms" x="76" y="79" width="9" height="25" rx="4.500"/>

    <circle class="base" cx="19.500" cy="110" r="4.500"/>
    <circle class="base" cx="80.500" cy="110" r="4.500"/>

    <rect class="m" data-m="lowerback" x="38" y="84" width="24" height="9" rx="4.500"/>

    <rect class="m" data-m="glutes" x="33" y="95" width="16" height="16" rx="7"/>
    <rect class="m" data-m="glutes" x="51" y="95" width="16" height="16" rx="7"/>

    <rect class="m" data-m="hamstrings" x="33" y="113" width="15" height="40" rx="7.500"/>
    <rect class="m" data-m="hamstrings" x="52" y="113" width="15" height="40" rx="7.500"/>

    <circle class="base" cx="40.500" cy="158.500" r="4.500"/>
    <circle class="base" cx="59.500" cy="158.500" r="4.500"/>

    <rect class="m" data-m="calves" x="34" y="165" width="13" height="36" rx="6.500"/>
    <rect class="m" data-m="calves" x="53" y="165" width="13" height="36" rx="6.500"/>

    <rect class="base" x="34" y="205" width="12" height="7" rx="3.500"/>
    <rect class="base" x="54" y="205" width="12" height="7" rx="3.500"/>

    <text class="map-label" x="50" y="229" text-anchor="middle">BACK</text>
  </g>
</svg>`;

// Put a body map inside an element and light up the muscles.
// levels looks like { chest: 2, triceps: 1 }: 2 = main muscle, 1 = helper.
function drawBodyMap(element, levels) {
  // Only draw the figure the first time, so colours can fade when levels change
  if (!element.querySelector("svg")) {
    element.innerHTML = BODY_SVG;
  }

  element.querySelectorAll("[data-m]").forEach((shape) => {
    const level = levels[shape.dataset.m] || 0;
    shape.classList.toggle("on", level === 2);
    shape.classList.toggle("half", level === 1);
  });
}
