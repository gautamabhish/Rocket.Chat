import type { IOmnichannelAgent } from '@rocket.chat/core-typings';
import { useUser, useSetting, usePermission, useEndpoint, useStream } from '@rocket.chat/ui-contexts';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { useEffect, useMemo, memo } from 'react';

import { useLivechatInquiries } from './useLivechatInquiries';
import { useRoutingConfigQuery } from './useRoutingConfigQuery';
import type { OmnichannelContextValue } from '../../contexts/OmnichannelContext';
import { OmnichannelContext } from '../../contexts/OmnichannelContext';
import { useHasLicenseModule } from '../../hooks/useHasLicenseModule';
import { useShouldPreventAction } from '../../hooks/useShouldPreventAction';

const emptyContextValue: OmnichannelContextValue = {
	inquiries: { enabled: false },
	enabled: false,
	isEnterprise: false,
	agentAvailable: false,
	showOmnichannelQueueLink: false,
	isOverMacLimit: false,
	livechatPriorities: {
		enabled: false,
		data: [],
		isLoading: false,
		isError: false,
	},
};

type OmnichannelProviderProps = {
	children?: ReactNode;
};

const OmnichannelProvider = ({ children }: OmnichannelProviderProps) => {
	const omniChannelEnabled = useSetting('Livechat_enabled', true);
	const showOmnichannelQueueLink = useSetting('Livechat_show_queue_list_link', false);

	const hasAccess = usePermission('view-l-room');
	const canViewOmnichannelQueue = usePermission('view-livechat-queue');
	const user = useUser() as IOmnichannelAgent;

	const agentAvailable = user?.statusLivechat === 'available';
	const voipCallAvailable = true; // TODO: use backend check;

	const { data: routeConfig } = useRoutingConfigQuery();

	const accessible = hasAccess && omniChannelEnabled;
	const isEnterprise = useHasLicenseModule('livechat-enterprise') === true;

	const getPriorities = useEndpoint('GET', '/v1/livechat/priorities');
	const subscribe = useStream('notify-logged');
	const queryClient = useQueryClient();
	const isPrioritiesEnabled = isEnterprise && accessible;
	const enabled = accessible && !!user && !!routeConfig;

	const {
		data: { priorities = [] } = {},
		isLoading: isLoadingPriorities,
		isError: isErrorPriorities,
	} = useQuery({
		queryKey: ['/v1/livechat/priorities'],
		queryFn: () => getPriorities({ sort: JSON.stringify({ sortItem: 1 }) }),
		staleTime: Infinity,
		enabled: isPrioritiesEnabled,
	});

	const isOverMacLimit = useShouldPreventAction('monthlyActiveContacts');

	useEffect(() => {
		if (!isPrioritiesEnabled) {
			return;
		}

		return subscribe('omnichannel.priority-changed', () => {
			queryClient.invalidateQueries({
				queryKey: ['/v1/livechat/priorities'],
			});
		});
	}, [isPrioritiesEnabled, queryClient, subscribe]);

	const manuallySelected =
		enabled && canViewOmnichannelQueue && !!routeConfig && routeConfig.showQueue && !routeConfig.autoAssignAgent && agentAvailable;

	const inquiries = useLivechatInquiries({ manuallySelected });

	const contextValue = useMemo<OmnichannelContextValue>(() => {
		if (!enabled) {
			return emptyContextValue;
		}

		const livechatPriorities = {
			enabled: isPrioritiesEnabled,
			data: priorities,
			isLoading: isLoadingPriorities,
			isError: isErrorPriorities,
		};

		if (!manuallySelected) {
			return {
				...emptyContextValue,
				enabled: true,
				isEnterprise,
				agentAvailable,
				voipCallAvailable,
				routeConfig,
				livechatPriorities,
				isOverMacLimit,
			};
		}

		return {
			...emptyContextValue,
			enabled: true,
			isEnterprise,
			agentAvailable,
			voipCallAvailable,
			routeConfig,
			inquiries,
			showOmnichannelQueueLink: showOmnichannelQueueLink && !!agentAvailable,
			livechatPriorities,
			isOverMacLimit,
		};
	}, [
		enabled,
		isPrioritiesEnabled,
		priorities,
		isLoadingPriorities,
		isErrorPriorities,
		manuallySelected,
		isEnterprise,
		agentAvailable,
		voipCallAvailable,
		routeConfig,
		inquiries,
		showOmnichannelQueueLink,
		isOverMacLimit,
	]);

	return <OmnichannelContext.Provider children={children} value={contextValue} />;
};

export default memo(OmnichannelProvider);
