import React from 'react';
import { TokenImage } from 'uniswap-dapp-integration-shared';
import { Image } from 'antd';

const TokenIcon = ({
    classes,
    tokenImageContext,
}: {
    classes: string;
    tokenImageContext: TokenImage;
}): JSX.Element => (
    <React.Fragment>
        {!tokenImageContext.isSvg && (
            <Image src={tokenImageContext.image} className={classes} preview={false} />
        )}
        {tokenImageContext.isSvg && (
            <span className={classes}>
                <span
                    dangerouslySetInnerHTML={{
                        __html: tokenImageContext.image,
                    }}
                ></span>
            </span>
        )}
    </React.Fragment>
);

export default TokenIcon;
