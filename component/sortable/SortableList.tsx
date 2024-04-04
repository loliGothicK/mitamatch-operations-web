import React, { useState } from 'react';

import {
  closestCenter,
  DndContext,
  DndContextProps,
  DragEndEvent,
  DraggableAttributes,
  KeyboardSensor,
  PointerSensor,
  UniqueIdentifier,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { SyntheticListenerMap } from '@dnd-kit/core/dist/hooks/utilities';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

export type SortableListProps<T extends { id: UniqueIdentifier }> = {
  items: T[];
  renterItem: ({
    item,
    attributes,
    listeners,
    setNodeRef,
    style,
  }: {
    item: T;
    attributes: DraggableAttributes;
    listeners: SyntheticListenerMap | undefined;
    setNodeRef: (node: HTMLElement | null) => void;
    style: React.CSSProperties;
  }) => React.ReactNode;
  dnd?: DndContextProps;
};

export default function SortableList<T extends { id: UniqueIdentifier }>(
  props: SortableListProps<T> & DndContextProps,
) {
  const [items, setItems] = useState(props.items);
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
      onDragEnd={handleDragEnd}
      {...props.dnd}
    >
      <SortableContext items={items} strategy={verticalListSortingStrategy}>
        {items.map((item) => {
          const {
            attributes,
            listeners,
            setNodeRef,
            transform,
            transition,
            isDragging,
          } = useSortable({ id: item.id });

          const style = {
            transform: CSS.Transform.toString(transform),
            transition,
            zIndex: isDragging ? Number.POSITIVE_INFINITY : 'auto',
            opacity: isDragging ? 0.3 : 1,
          };

          return props.renterItem({
            item,
            attributes,
            listeners,
            setNodeRef,
            style,
          });
        })}
      </SortableContext>
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
