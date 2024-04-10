import type React from 'react';
import type { PropsWithChildren, SetStateAction } from 'react';

import type {
  DndContextProps,
  DragEndEvent,
  UniqueIdentifier,
} from '@dnd-kit/core';
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import type { SortingStrategy } from '@dnd-kit/sortable';
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';
import type { OmitProperties } from 'ts-essentials';

/**
 * Props for Sortable components
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
  onChangeOrder: React.Dispatch<SetStateAction<T[]>>;
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
  dnd?: OmitProperties<DndContextProps, 'onDragEnd'>;
}>;

/**
 * Sortable components
 * @param items - ソート対象のアイテム
 * @param onChangeOrder - ソート時に呼び出される {@link React.Dispatch} 関数
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
  onChangeOrder,
  children,
  strategy,
  dnd,
}: SortableProps<T>) {
  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over !== null && active.id !== over.id) {
      const oldIndex = items.findIndex(item => item.id === active.id);
      const newIndex = items.findIndex(item => item.id === over.id);

      const newItems = arrayMove(items, oldIndex, newIndex);

      onChangeOrder(newItems);
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
