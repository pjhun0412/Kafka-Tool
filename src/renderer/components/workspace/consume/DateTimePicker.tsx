import { useEffect, useMemo, useRef, useState } from "react";
import { Calendar, ChevronLeft, ChevronRight, Clock } from "lucide-react";
import { useAppLanguage } from "../../../hooks/state/useAppLanguage";
import { t } from "../../../i18n";

const weekdayLabels = ["S", "M", "T", "W", "T", "F", "S"];

function pad(value: number) {
  return String(value).padStart(2, "0");
}

function toInputValue(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function parseInputValue(value: string) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function getMonthDays(displayDate: Date) {
  const year = displayDate.getFullYear();
  const month = displayDate.getMonth();
  const first = new Date(year, month, 1);
  const start = new Date(year, month, 1 - first.getDay());
  return Array.from({ length: 42 }, (_, index) => {
    const day = new Date(start);
    day.setDate(start.getDate() + index);
    return day;
  });
}

function isSameDate(left: Date, right: Date) {
  return left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate();
}

function formatDisplay(value: string) {
  const date = parseInputValue(value);
  if (!date) return "";
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function DateTimePicker(props: {
  value: string;
  label: string;
  onChange: (value: string) => void;
}) {
  const language = useAppLanguage();
  const pickerRef = useRef<HTMLDivElement | null>(null);
  const selectedDate = parseInputValue(props.value);
  const [open, setOpen] = useState(false);
  const [displayDate, setDisplayDate] = useState(selectedDate ?? new Date());
  const [timeValue, setTimeValue] = useState(
    selectedDate ? `${pad(selectedDate.getHours())}:${pad(selectedDate.getMinutes())}` : "00:00"
  );
  const monthDays = useMemo(() => getMonthDays(displayDate), [displayDate]);

  useEffect(() => {
    const parsed = parseInputValue(props.value);
    if (!parsed) return;
    setDisplayDate(parsed);
    setTimeValue(`${pad(parsed.getHours())}:${pad(parsed.getMinutes())}`);
  }, [props.value]);

  useEffect(() => {
    if (!open) return;
    function closeOnOutsideClick(event: MouseEvent) {
      if (!pickerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    window.addEventListener("mousedown", closeOnOutsideClick);
    return () => window.removeEventListener("mousedown", closeOnOutsideClick);
  }, [open]);

  function applyDate(day: Date, nextTimeValue = timeValue) {
    const [hours = "0", minutes = "0"] = nextTimeValue.split(":");
    const next = new Date(day);
    next.setHours(Number(hours), Number(minutes), 0, 0);
    props.onChange(toInputValue(next));
  }

  function moveMonth(delta: number) {
    setDisplayDate((current) => new Date(current.getFullYear(), current.getMonth() + delta, 1));
  }

  function selectToday() {
    const today = new Date();
    setDisplayDate(today);
    setTimeValue(`${pad(today.getHours())}:${pad(today.getMinutes())}`);
    props.onChange(toInputValue(today));
  }

  return (
    <div className="datetime-picker" ref={pickerRef}>
      <button type="button" className="datetime-trigger" onClick={() => setOpen((current) => !current)}>
        <Calendar size={14} />
        <span>{formatDisplay(props.value) || props.label}</span>
      </button>
      {open && (
        <div className="datetime-popover">
          <div className="datetime-popover-header">
            <button type="button" onClick={() => moveMonth(-1)}><ChevronLeft size={15} /></button>
            <strong>{displayDate.getFullYear()} {displayDate.toLocaleString(language === "ko" ? "ko-KR" : "en-US", { month: "long" })}</strong>
            <button type="button" onClick={() => moveMonth(1)}><ChevronRight size={15} /></button>
          </div>
          <div className="datetime-weekdays">
            {weekdayLabels.map((day, index) => <span key={`${day}-${index}`}>{day}</span>)}
          </div>
          <div className="datetime-days">
            {monthDays.map((day) => {
              const selected = selectedDate && isSameDate(day, selectedDate);
              const today = isSameDate(day, new Date());
              const muted = day.getMonth() !== displayDate.getMonth();
              return (
                <button
                  type="button"
                  key={day.toISOString()}
                  className={`${selected ? "selected" : ""} ${today ? "today" : ""} ${muted ? "muted" : ""}`}
                  onClick={() => applyDate(day)}
                >
                  {day.getDate()}
                </button>
              );
            })}
          </div>
          <div className="datetime-footer">
            <label>
              <Clock size={14} />
              <input
                type="time"
                value={timeValue}
                onChange={(event) => {
                  setTimeValue(event.target.value);
                  applyDate(selectedDate ?? displayDate, event.target.value);
                }}
              />
            </label>
            <button type="button" onClick={selectToday}>{t(language, "label.today")}</button>
          </div>
        </div>
      )}
    </div>
  );
}
