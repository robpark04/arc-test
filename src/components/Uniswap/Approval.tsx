import React from 'react';
import {
    MiningTransaction,
    TradeContext,
    TransactionStatus,
    UniswapDappSharedLogic,
} from 'uniswap-dapp-integration-shared';
import { Button } from 'antd';
import TokenIcon from './TokenIcon';

const Approval = ({
    uniswapDappSharedLogic,
    tradeContext,
    miningTransaction,
    miningTransactionStatus,
}: {
    uniswapDappSharedLogic: UniswapDappSharedLogic;
    tradeContext: TradeContext | undefined;
    miningTransaction: MiningTransaction | undefined;
    miningTransactionStatus: TransactionStatus | undefined;
}): JSX.Element => {
    const transactionStatus = TransactionStatus;

    return (
        <div>
            {tradeContext?.approvalTransaction &&
                tradeContext?.fromBalance?.hasEnough && (
                    <Button
                        className="uni-ic__swap-allow uni-ic__theme-background-button"
                        onClick={() => uniswapDappSharedLogic.approveAllowance()}
                        disabled={uniswapDappSharedLogic.transactionInProcess()}
                    >
                        <TokenIcon
                            classes="uni-ic__swap-allow-icon"
                            tokenImageContext={
                                uniswapDappSharedLogic.inputToken.tokenImageContext
                            }
                        />

                        {(miningTransaction === undefined ||
                            miningTransactionStatus === transactionStatus.rejected) && (
                                <span>
                                    You must give the Uniswap smart contract permisson to use your{' '}
                                    {tradeContext!.fromToken.symbol}. You only have to do this once
                                    per token per uniswap version. Click here to approve the
                                    permissons.
                                </span>
                            )}

                        {miningTransaction?.status ===
                            transactionStatus.waitingForConfirmation && (
                                <span>Waiting for confirmation....</span>
                            )}

                        {miningTransaction?.status === transactionStatus.mining && (
                            <span>
                                Waiting for your transaction to be mined...
                                <u>
                                    <Button
                                        className="uni-ic__swap-allow-etherscan"
                                        onClick={() => uniswapDappSharedLogic.viewOnEtherscan()}
                                        type="link"
                                    >
                                        View tx on etherscan
                                    </Button>
                                </u>
                            </span>
                        )}
                    </Button>
                )}
        </div>
    );
};

export default Approval;
