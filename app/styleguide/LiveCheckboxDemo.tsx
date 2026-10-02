"use client";

import { useState } from "react";
import { Checkbox } from "@/components/Checkbox";

export function LiveCheckboxDemo() {
  const [checked, setChecked] = useState(false);
  return <Checkbox checked={checked} onToggle={() => setChecked((c) => !c)} label="Demo chore" />;
}
