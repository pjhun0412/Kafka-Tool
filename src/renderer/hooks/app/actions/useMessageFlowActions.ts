import { useConsumeActions, useMessageExportActions, useProduceActions } from "../../actions";

type MessageFlowActionsParams = {
  consume: Parameters<typeof useConsumeActions>[0];
  exportMessages: Parameters<typeof useMessageExportActions>[0];
  produce: Parameters<typeof useProduceActions>[0];
};

export function useMessageFlowActions(params: MessageFlowActionsParams) {
  const consumeActions = useConsumeActions(params.consume);
  const exportActions = useMessageExportActions(params.exportMessages);
  const produceActions = useProduceActions(params.produce);

  return {
    consumeActions,
    exportActions,
    produceActions
  };
}
