import type { OmichannelRoutingConfig, ILivechatPriority, Serialized, IRoom, ILivechatInquiryRecord } from '@rocket.chat/core-typings';
import { createContext } from 'react';

type Inquiries =
	| {
			enabled: true;
			queue: Array<ILivechatInquiryRecord>;
			discardInquiry: (rid: IRoom['_id']) => void;
	  }
	| {
			enabled: false;
			queue?: undefined;
			discardInquiry?: undefined;
	  };

export type OmnichannelContextValue = {
	inquiries: Inquiries;
	enabled: boolean;
	isEnterprise: boolean;
	agentAvailable: boolean;
	routeConfig?: OmichannelRoutingConfig;
	showOmnichannelQueueLink: boolean;
	isOverMacLimit: boolean;
	livechatPriorities: {
		data: Serialized<ILivechatPriority>[];
		isLoading: boolean;
		isError: boolean;
		enabled: boolean;
	};
};

export const OmnichannelContext = createContext<OmnichannelContextValue>({
	inquiries: { enabled: false },
	enabled: false,
	isEnterprise: false,
	agentAvailable: false,
	showOmnichannelQueueLink: false,
	isOverMacLimit: false,
	livechatPriorities: {
		data: [],
		isLoading: false,
		isError: false,
		enabled: false,
	},
});
