import React from 'react';
import ChecklistTrailNode from '@/components/checklist/ChecklistTrailNode';

/** Trilha vertical do checklist — o aluno avança marco a marco, como na Ofensiva. */
export default function ChecklistTrail({ items, focusIndex, onSelect }) {
  return (
    <div className="relative flex select-none flex-col items-center py-2">
      {items.map((item, index) => {
        const state = item.done ? 'done' : index === focusIndex ? 'current' : 'locked';
        return (
          <React.Fragment key={item.key}>
            <ChecklistTrailNode item={item} index={index} state={state} onPress={() => onSelect(index)} />
            {index < items.length - 1 && (
              <div className="my-1 flex justify-center">
                <div className={`h-6 w-1 rounded-full ${item.done ? 'bg-green-400' : 'bg-border'}`} />
              </div>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}