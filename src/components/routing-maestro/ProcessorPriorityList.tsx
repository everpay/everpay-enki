import { DndContext, closestCenter, DragEndEvent, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { MerchantProcessor } from "@/lib/routing-maestro/mock-data";

interface SortableProcessorProps {
  proc: MerchantProcessor;
  onToggle: (id: string) => void;
  onWeightChange: (id: string, weight: number) => void;
}

function SortableProcessor({ proc, onToggle, onWeightChange }: SortableProcessorProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: proc.processorId });
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-4 rounded-lg border bg-card p-4 ${isDragging ? 'shadow-lg ring-2 ring-primary/20 z-10' : ''}`}
    >
      <button {...attributes} {...listeners} className="cursor-grab text-muted-foreground hover:text-foreground">
        <GripVertical className="h-4 w-4" />
      </button>
      <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-sm font-bold text-primary">
        {proc.priority}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm text-foreground">{proc.processorName}</span>
          {!proc.enabled && <span className="text-xs text-muted-foreground">(disabled)</span>}
        </div>
        <div className="mt-2 flex items-center gap-3">
          <span className="text-xs text-muted-foreground w-16">Weight: {proc.weight}%</span>
          <Slider
            value={[proc.weight]}
            onValueChange={([v]) => onWeightChange(proc.processorId, v)}
            max={100}
            step={5}
            className="flex-1 max-w-[200px]"
            disabled={!proc.enabled}
          />
        </div>
        <div className="mt-1 text-xs text-muted-foreground font-mono">
          Cap: ${(proc.currentVolume / 1000).toFixed(0)}k / ${(proc.monthlyCap / 1000).toFixed(0)}k
        </div>
      </div>
      <Switch checked={proc.enabled} onCheckedChange={() => onToggle(proc.processorId)} />
    </div>
  );
}

interface ProcessorPriorityListProps {
  processors: MerchantProcessor[];
  onUpdate: (processors: MerchantProcessor[]) => void;
}

export function ProcessorPriorityList({ processors, onUpdate }: ProcessorPriorityListProps) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = processors.findIndex((p) => p.processorId === active.id);
      const newIndex = processors.findIndex((p) => p.processorId === over.id);
      const reordered = arrayMove(processors, oldIndex, newIndex).map((p, i) => ({ ...p, priority: i + 1 }));
      onUpdate(reordered);
    }
  };
  const handleToggle = (id: string) => onUpdate(processors.map((p) => (p.processorId === id ? { ...p, enabled: !p.enabled } : p)));
  const handleWeightChange = (id: string, weight: number) => onUpdate(processors.map((p) => (p.processorId === id ? { ...p, weight } : p)));
  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={processors.map((p) => p.processorId)} strategy={verticalListSortingStrategy}>
        <div className="space-y-2">
          {processors.map((proc) => (
            <SortableProcessor key={proc.processorId} proc={proc} onToggle={handleToggle} onWeightChange={handleWeightChange} />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
