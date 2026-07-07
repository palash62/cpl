import { Element } from "@craftjs/core";
import { Columns, Column } from "@/modules/page-builder/blocks/basic";

export function buildRowElement(columnCount: number) {
  return (
    <Element is={Columns} columns={columnCount} canvas>
      {Array.from({ length: columnCount }).map((_, index) => (
        <Element key={index} is={Column} columnIndex={index + 1} canvas />
      ))}
    </Element>
  );
}
