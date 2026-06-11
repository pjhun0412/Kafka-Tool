import React from "react";
import { X } from "lucide-react";
import { useAppLanguage } from "../../../hooks/state/useAppLanguage";
import { t } from "../../../i18n";

export function OpenedTopicTabs(props: {
  topics: string[];
  selectedTopic: string;
  previewTopic?: string;
  hasAvroSchema: (topic: string) => boolean;
  onActivate: () => void;
  onSelect: (topic: string) => void;
  onClose: (topic: string) => void;
  onDragStart: (event: React.DragEvent, topic: string) => void;
  onDragEnd: () => void;
}) {
  const language = useAppLanguage();
  return (
    <div className="topic-tabs" aria-label="Opened topics">
      {props.topics.length === 0 ? (
        <div className="topic-tabs-empty">{t(language, "topic.select")}</div>
      ) : (
        props.topics.map((topic) => (
          <button
            key={topic}
            className={[
              topic === props.selectedTopic ? "topic-tab active" : "topic-tab",
              topic === props.previewTopic ? "preview" : ""
            ].filter(Boolean).join(" ")}
            draggable
            title={topic}
            onMouseDown={(event) => {
              event.stopPropagation();
              props.onActivate();
            }}
            onDragStart={(event) => props.onDragStart(event, topic)}
            onDragEnd={props.onDragEnd}
            onClick={() => props.onSelect(topic)}
            onAuxClick={(event) => {
              if (event.button === 1) {
                event.preventDefault();
                props.onClose(topic);
              }
            }}
          >
            <span>{topic}</span>
            {props.hasAvroSchema(topic) && <span className="topic-tab-badge" title="Avro schema registered">Avro</span>}
            <X size={14} onClick={(event) => { event.stopPropagation(); props.onClose(topic); }} />
          </button>
        ))
      )}
    </div>
  );
}
