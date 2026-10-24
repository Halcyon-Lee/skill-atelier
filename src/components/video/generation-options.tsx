"use client";
import { useId, useState } from "react";
import {
  ASPECT_OPTIONS, RESOLUTION_OPTIONS, PACE_OPTIONS, MIN_VIDEO_DURATION, MAX_VIDEO_DURATION,
  videoDimensions, type VideoOptions,
} from "@/lib/video/options";
function OptionSelect<T extends string | number>({ id, label, value, choices, onChange }: {
  id: string; label: string; value: T; choices: readonly { value: T; label: string }[]; onChange: (value: T) => void;
}) {
  return <div>
    <label htmlFor={id} className="mb-2 block text-xs text-muted">{label}</label>
    <select id={id} value={value} onChange={event => {
      const choice = choices.find(item => String(item.value) === event.target.value);
      if (choice) onChange(choice.value);
    }} className="field !h-11 !bg-paper !text-sm">
      {choices.map(choice => <option key={choice.value} value={choice.value}>{choice.label}</option>)}
    </select>
  </div>;
}
function DurationInput({ id, value, onChange }: { id: string; value: number; onChange: (value: number) => void }) {
  const [edit, setEdit] = useState({ base: value, text: String(value) });
  const text = edit.base === value ? edit.text : String(value);
  return <div>
    <label htmlFor={id} className="mb-2 block text-xs text-muted">成片时长</label>
    <div className="flex h-11 items-center rounded-lg border border-line bg-paper focus-within:border-accent">
      <input id={id} type="number" inputMode="numeric" min={MIN_VIDEO_DURATION} max={MAX_VIDEO_DURATION} step={1} required
        value={text} onChange={event => {
          const number = event.target.valueAsNumber;
          const valid = Number.isInteger(number) && number >= MIN_VIDEO_DURATION && number <= MAX_VIDEO_DURATION;
          setEdit({ base: valid ? number : value, text: event.target.value });
          if (valid) onChange(number);
        }} aria-describedby={`${id}-help`} className="h-full min-w-0 flex-1 rounded-lg bg-transparent px-3 text-sm outline-none"/>
      <span className="pr-3 text-xs text-faint">秒</span>
    </div>
    <p id={`${id}-help`} className="mt-1.5 text-[11px] text-faint">最长 600 秒（10 分钟）</p>
  </div>;
}
export function GenerationOptions({ value, onChange }: { value: VideoOptions; onChange: (value: VideoOptions) => void }) {
  const id = useId(), dimensions = videoDimensions(value);
  return <fieldset className="my-6 rounded-xl border border-line bg-paper/40 p-4">
    <legend className="px-2 text-xs font-medium text-ink">生成设置</legend>
    <div className="grid grid-cols-2 gap-x-3 gap-y-4">
      <OptionSelect id={`${id}-aspect`} label="画幅尺寸" choices={ASPECT_OPTIONS} value={value.aspectRatio} onChange={aspectRatio => onChange({ ...value, aspectRatio })}/>
      <OptionSelect id={`${id}-resolution`} label="分辨率" choices={RESOLUTION_OPTIONS} value={value.resolution} onChange={resolution => onChange({ ...value, resolution })}/>
      <DurationInput id={`${id}-duration`} value={value.duration} onChange={duration => onChange({ ...value, duration })}/>
      <OptionSelect id={`${id}-pace`} label="视频节奏" choices={PACE_OPTIONS} value={value.pace} onChange={pace => onChange({ ...value, pace })}/>
    </div>
    <p className="mt-4 border-t border-line pt-3 font-mono text-[11px] text-faint" aria-live="polite">
      {dimensions.width} × {dimensions.height} px <span aria-hidden="true">·</span> 24 fps
    </p>
  </fieldset>;
}
