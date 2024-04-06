import React, { PropsWithChildren, SetStateAction, useState } from 'react';

import {
  closestCenter,
  DndContext,
  DndContextProps,
  DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  UniqueIdentifier,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';

export type SortableListProps<T extends { id: UniqueIdentifier }> = {
  items: T[];
  setItems?: React.Dispatch<SetStateAction<T[]>>;
  dnd?: DndContextProps;
};

export default function Sortable<T extends { id: UniqueIdentifier }>(
  props: PropsWithChildren<SortableListProps<T>>,
) {
  const [items, setItems] = props.setItems
    ? [props.items, props.setItems]
    : useState(props.items);
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={props.dnd?.onDragEnd ? props.dnd?.onDragEnd : handleDragEnd}
      {...props.dnd}
    >
      <SortableContext items={items}>{props.children}</SortableContext>
    </DndContext>
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (!!over && active.id !== over.id) {
      setItems((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);

        return arrayMove(items, oldIndex, newIndex);
      });
    }
  }
}
