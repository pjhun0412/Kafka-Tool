import React, { useEffect, useRef } from "react";
import { Star } from "lucide-react";
import type { TopicSummary } from "../../../../shared/types";
import { formatCount } from "../../../utils";

export function TopicListItem(props: {
  topic: TopicSummary;
  active: boolean;
  favorite: boolean;
  hasAvroSchema: boolean;
  onSelect: () => void;
  onOpen: () => void;
  onToggleFavorite: () => void;
  onContextMenu: (event: React.MouseEvent) => void;
  draggable?: boolean;
  dragging?: boolean;
  dropPosition?: "before" | "after" | null;
  onDragStart?: (event: React.DragEvent<HTMLButtonElement>) => void;
  onDragOver?: (event: React.DragEvent<HTMLButtonElement>) => void;
  onDragLeave?: (event: React.DragEvent<HTMLButtonElement>) => void;
  onDrop?: (event: React.DragEvent<HTMLButtonElement>) => void;
  onDragEnd?: (event: React.DragEvent<HTMLButtonElement>) => void;
}) {
  const clickTimerRef = useRef<number | null>(null);
  const classNames = [
    props.active ? "topic active" : "topic",
    props.dragging ? "dragging" : "",
    props.dropPosition ? `drop-${props.dropPosition}` : ""
  ].filter(Boolean).join(" ");

  useEffect(() => () => {
    if (clickTimerRef.current) {
      window.clearTimeout(clickTimerRef.current);
    }
  }, []);

  function scheduleSelect() {
    if (clickTimerRef.current) {
      window.clearTimeout(clickTimerRef.current);
    }
    clickTimerRef.current = window.setTimeout(() => {
      clickTimerRef.current = null;
      props.onSelect();
    }, 180);
  }

  function openTopic() {
    if (clickTimerRef.current) {
      window.clearTimeout(clickTimerRef.current);
      clickTimerRef.current = null;
    }
    props.onOpen();
  }

  return (
    <button
      className={classNames}
      draggable={props.draggable}
      onClick={scheduleSelect}
      onDoubleClick={openTopic}
      onContextMenu={props.onContextMenu}
      onDragStart={props.onDragStart}
      onDragOver={props.onDragOver}
      onDragLeave={props.onDragLeave}
      onDrop={props.onDrop}
      onDragEnd={props.onDragEnd}
      title={`${props.topic.name} (${props.topic.partitions} partitions / RF ${props.topic.replicationFactor})`}
    >
      <span
        className={props.favorite ? "topic-favorite favorite" : "topic-favorite"}
        onClick={(event) => {
          event.stopPropagation();
          props.onToggleFavorite();
        }}
        title={props.favorite ? "Remove favorite" : "Add favorite"}
      >
        <Star size={14} fill={props.favorite ? "currentColor" : "none"} />
      </span>
      <span className="topic-copy">
        <strong title={props.topic.name}>
          <span>{props.topic.name}</span>
          {props.hasAvroSchema && <span className="topic-avro-badge" title="Avro schema registered">Avro</span>}
        </strong>
        <small title={`${props.topic.partitions} partitions / RF ${props.topic.replicationFactor} / ${formatCount(props.topic.messageCount)} messages`}>
          P {props.topic.partitions} / RF {props.topic.replicationFactor} / {formatCount(props.topic.messageCount)} msgs
        </small>
      </span>
    </button>
  );
}
