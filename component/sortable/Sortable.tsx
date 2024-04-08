import type React from 'react';
import type { PropsWithChildren, SetStateAction } from 'react';

import type {
  DndContextProps,
  DragEndEvent,
  UniqueIdentifier,
} from '@dnd-kit/core';
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import type { SortingStrategy } from '@dnd-kit/sortable';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';

/**
 * Props for Sortable component
 */
export type SortableProps<T> = PropsWithChildren<{
  /**
   * ソート対象のアイテム
   */
  items: T[];
  /**
   * ソート対象のアイテムを更新する {@link React.Dispatch} 関数
   *
   * @example
   * const [items, setItems] = useState<T[]>([...]);
   * <Sortable items={items} setItems={setItems}>
   *   ...
   * </Sortable>
   */
  setItems: React.Dispatch<SetStateAction<T[]>>;
  /**
   * ソートの戦略
   *
   * @see https://docs.dndkit.com/presets/sortable/sortable-context#strategy
   */
  strategy?: SortingStrategy;
  /**
   * DndContext のプロパティ
   * {@link DndContextProps} をカスタマイズしたい場合に使用する
   *
   * @example
   * const dnd = {
   *  autoScroll: true,
   * };
   * <Sortable dnd={dnd}>
   *   ...
   * </Sortable>
   *
   * @see https://docs.dndkit.com/api-documentation/context-provider#props
   */
  dnd?: DndContextProps;
}>;

/**
 * Sortable component
 * @param items - ソート対象のアイテム
 * @param setItems - ソート対象のアイテムを更新する {@link React.Dispatch} 関数
 * @param children - ソート対象のアイテムを表示するコンポーネント
 * @param strategy - [optional] ソートの戦略
 * @param dnd - [optional] {@link DndContext} のプロパティ
 * @return React.ReactNode
 * @remarks
 *  - ソート対象のアイテムはコンポーネントの外側で管理することが前提
 * @example
 * const [items, setItems] = useState<T[]>([...]);
 * <Sortable items={items} setItems={setItems}>
 *   {items.map((item) => (
 *     <SortableItem key={item.id} id={item.id}>
 *       {item.name}
 *     </SortableItem>
 *   ))}
 * </Sortable>
 */
export default function Sortable<T extends { id: UniqueIdentifier }>({
  items,
  setItems,
  children,
  strategy,
  dnd,
}: SortableProps<T>) {
  const onDragEnd =
    dnd !== undefined && dnd.onDragEnd !== undefined
      ? (event: DragEndEvent) => {
          dnd.onDragEnd!(event);
        }
      : (event: DragEndEvent) => {
          const { active, over } = event;

          if (over !== null && active.id !== over.id) {
            setItems((items) => {
              const oldIndex = items.findIndex((item) => item.id === active.id);
              const newIndex = items.findIndex((item) => item.id === over.id);

              return arrayMove(items, oldIndex, newIndex);
            });
          }
        };
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
      onDragEnd={onDragEnd}
      {...dnd}
    >
      <SortableContext items={items} strategy={strategy}>
        {children}
      </SortableContext>
    </DndContext>
  );
}
