import { OFFSET_PAGE_SIZE } from "../../../consumeConfig";
import { useAppLanguage } from "../../../hooks/state/useAppLanguage";
import { t } from "../../../i18n";
import type { TopicConsumeState } from "../../../uiTypes";
import { Button } from "../../ui";

export function ConsumePagingBar(props: {
  isQuerying: boolean;
  limit: number;
  pagination: TopicConsumeState["offsetPagination"];
  onPagePrev: () => void;
  onPageNext: () => void;
}) {
  const language = useAppLanguage();
  const page = String(props.pagination ? props.pagination.pageIndex + 1 : 1);
  const total = String(Math.max(1, Math.ceil(props.limit / OFFSET_PAGE_SIZE)));
  const count = OFFSET_PAGE_SIZE.toLocaleString();
  return (
    <div className="paging-bar">
      <span>{t(language, "label.pageStatus", { page, total, count })}</span>
      <div>
        <Button variant="ghost" size="sm" onClick={props.onPagePrev} disabled={props.isQuerying || !props.pagination || props.pagination.prevOffsets.length === 0}>{t(language, "label.prev")}</Button>
        <Button variant="ghost" size="sm" onClick={props.onPageNext} disabled={props.isQuerying || !props.pagination?.hasNext}>{t(language, "label.next")}</Button>
      </div>
    </div>
  );
}
