import type { TopicConsumeState } from "../../../uiTypes";
import { OFFSET_PAGE_SIZE } from "../../../consumeConfig";
import { Button } from "../../ui";

export function ConsumePagingBar(props: {
  isQuerying: boolean;
  limit: number;
  pagination: TopicConsumeState["offsetPagination"];
  onPagePrev: () => void;
  onPageNext: () => void;
}) {
  return (
    <div className="paging-bar">
      <span>
        Page {props.pagination ? props.pagination.pageIndex + 1 : 1}
        {" "}of {Math.max(1, Math.ceil(props.limit / OFFSET_PAGE_SIZE))}
        {" "}夷?showing up to {OFFSET_PAGE_SIZE.toLocaleString()} messages
      </span>
      <div>
        <Button variant="ghost" size="sm" onClick={props.onPagePrev} disabled={props.isQuerying || !props.pagination || props.pagination.prevOffsets.length === 0}>Prev</Button>
        <Button variant="ghost" size="sm" onClick={props.onPageNext} disabled={props.isQuerying || !props.pagination?.hasNext}>Next</Button>
      </div>
    </div>
  );
}
