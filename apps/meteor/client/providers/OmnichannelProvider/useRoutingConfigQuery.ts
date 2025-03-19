import { useSetting, usePermission, useMethod } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';

import { omnichannelQueryKeys } from '../../lib/queryKeys';

export const useRoutingConfigQuery = () => {
	const omniChannelEnabled = useSetting('Livechat_enabled', true);
	const canViewLivechatRoom = usePermission('view-l-room');

	const getRoutingConfig = useMethod('livechat:getRoutingConfig');

	return useQuery({
		queryKey: omnichannelQueryKeys.routingConfig(),
		queryFn: async () => getRoutingConfig(),
		staleTime: Infinity,
		enabled: omniChannelEnabled && canViewLivechatRoom,
	});
};
