import { BigNumber } from 'bignumber.js';
import React, { useEffect } from 'react';
import {
    ErrorCodes,
    ExtendedToken,
    MiningTransaction,
    SelectTokenActionFrom,
    SwapSwitchResponse,
    TradeContext,
    TradeDirection,
    TransactionStatus,
    UniswapDappSharedLogic,
    UniswapDappSharedLogicContext,
    Utils as UniswapUtils,
} from 'uniswap-dapp-integration-shared';
import { Button, InputNumber } from 'antd';
import Approval from './Approval';
import ConfirmSwap from './ConfirmSwap';
import Header from './Header';
import Loading from './Loading';
import SwapQuoteInfo from './SwapQuoteInfo';
import TokenIcon from './TokenIcon';
import TokensModal from './TokensModal';
import TransactionModal from './TransactionModal';
import './styles.css';

let uniswapDappSharedLogic: undefined | UniswapDappSharedLogic;
const subscriptions: any[] = [];
const DEBOUNCE_DELAY = 250;

const UniswapReact = ({
    uniswapDappSharedLogicContext,
}: {
    uniswapDappSharedLogicContext: UniswapDappSharedLogicContext;
}): JSX.Element => {
    const [loading, setLoading] = React.useState(true);
    const [inputToken, setInputToken] = React.useState<ExtendedToken>();
    const [inputBalance, setInputBalance] = React.useState<string | undefined>();
    const [inputValue, setInputValue] = React.useState('');
    const [inputFiatPrice, setInputFiatPrice] = React.useState<
        BigNumber | undefined
    >();
    const [outputToken, setOutputToken] = React.useState<ExtendedToken>();
    const [outputBalance, setOutputBalance] = React.useState<
        string | undefined
    >();
    const [outputValue, setOutputValue] = React.useState('');
    const [outputFiatPrice, setOutputFiatPrice] = React.useState<
        BigNumber | undefined
    >();
    const [supportedNetwork, setSupportedNetwork] = React.useState(false);
    const [chainId, setChainId] = React.useState<number | undefined>();
    const [selectorOpenFrom, setSelectorOpenFrom] = React.useState<
        SelectTokenActionFrom | undefined
    >();
    const [tradeContext, setTradeContext] = React.useState<
        TradeContext | undefined
    >();
    const [newPriceTradeContext, setNewPriceTradeContext] = React.useState<
        TradeContext | undefined
    >();
    const [miningTransaction, setMiningTransaction] = React.useState<
        MiningTransaction | undefined
    >();

    const [miningTransactionStatus, setMiningTransactionStatus] = React.useState<
        TransactionStatus | undefined
    >();
    const [noLiquidityFound, setNoLiquidityFound] =
        React.useState<boolean>(false);
    const [debounceTimeout, setDebounceTimeout] = React.useState<
        NodeJS.Timeout | undefined
    >();

    const utils = UniswapUtils;

    useEffect(() => {
        (async () => {
            const sharedLogic = new UniswapDappSharedLogic(
                uniswapDappSharedLogicContext,
            );

            await sharedLogic!.init();

            const supportedNetworkTokens =
                uniswapDappSharedLogicContext.supportedNetworkTokens.find(
                    (t) => t.chainId === sharedLogic.chainId,
                );

            if (supportedNetworkTokens?.defaultInputValue) {
                setInputValue(supportedNetworkTokens.defaultInputValue);
            }

            setTradeContext(sharedLogic!.tradeContext);
            subscriptions.push(
                sharedLogic.tradeContext$.subscribe((context) => {
                    setTradeContext(context);
                    if (context) {
                        if (context.quoteDirection === TradeDirection.input) {
                            setOutputValue(context.expectedConvertQuote);
                        } else {
                            setInputValue(context.expectedConvertQuote);
                        }
                    }
                }),
            );

            subscriptions.push(
                sharedLogic.newPriceTradeContext$.subscribe((context) => {
                    setNewPriceTradeContext(context);
                }),
            );

            subscriptions.push(
                sharedLogic.tradeCompleted$.subscribe((completed: boolean) => {
                    if (completed) {
                        setNoLiquidityFound(false);
                        setInputValue('');
                        setOutputValue('');
                    }
                }),
            );

            if (tradeContext?.expectedConvertQuote) {
                setOutputValue(tradeContext.expectedConvertQuote);
            }

            uniswapDappSharedLogic = sharedLogic;

            setSupportedNetwork(uniswapDappSharedLogic.supportedNetwork);
            subscriptions.push(
                uniswapDappSharedLogic.supportedNetwork$.subscribe((supported) => {
                    setSupportedNetwork(supported);
                }),
            );

            setChainId(uniswapDappSharedLogic.chainId);
            subscriptions.push(
                uniswapDappSharedLogic.chainId$.subscribe((chainId) => {
                    setChainId(chainId);
                }),
            );

            setInputToken(uniswapDappSharedLogic.inputToken);
            setInputBalance(
                utils.toPrecision(uniswapDappSharedLogic.inputToken?.balance),
            );
            setInputFiatPrice(uniswapDappSharedLogic.inputToken?.fiatPrice);
            subscriptions.push(
                uniswapDappSharedLogic.inputToken$.subscribe((token) => {
                    setInputToken(token);
                    setInputBalance(utils.toPrecision(token.balance));
                    setInputFiatPrice(token.fiatPrice);
                }),
            );

            setOutputToken(uniswapDappSharedLogic.outputToken);

            if (uniswapDappSharedLogic.outputToken) {
                setOutputBalance(
                    utils.toPrecision(uniswapDappSharedLogic.outputToken.balance),
                );
                setOutputFiatPrice(uniswapDappSharedLogic.outputToken.fiatPrice);
            }
            subscriptions.push(
                uniswapDappSharedLogic.outputToken$.subscribe((token) => {
                    setOutputToken(token);
                    setOutputBalance(utils.toPrecision(token.balance));
                    setOutputFiatPrice(token.fiatPrice);
                }),
            );

            setSelectorOpenFrom(uniswapDappSharedLogic.selectorOpenFrom);
            subscriptions.push(
                uniswapDappSharedLogic.selectorOpenFrom$.subscribe((openFrom) => {
                    setSelectorOpenFrom(openFrom);
                }),
            );

            setMiningTransaction(uniswapDappSharedLogic.miningTransaction);
            setMiningTransactionStatus(
                uniswapDappSharedLogic.miningTransaction?.status,
            );
            subscriptions.push(
                uniswapDappSharedLogic.miningTransaction$.subscribe(
                    (_miningTransaction) => {
                        setMiningTransaction(_miningTransaction);
                        setMiningTransactionStatus(_miningTransaction?.status);
                    },
                ),
            );

            setLoading(false);
            subscriptions.push(
                uniswapDappSharedLogic.loading$.subscribe((loading) => {
                    setLoading(loading);
                }),
            );
        })();

        return () => {
            for (let i = 0; i < subscriptions.length; i++) {
                subscriptions[i].unsubscribe();
            }
        };
    }, []);

    const changeInputTradePrice = async (amount: string) => {
        if (isValidDecimalLength(amount, inputToken!)) {
            setInputValue(amount);
            if (!amount || new BigNumber(amount).isEqualTo(0)) {
                setOutputValue('');
                if (debounceTimeout) {
                    clearTimeout(debounceTimeout);
                }
                return;
            }

            if (debounceTimeout) {
                clearTimeout(debounceTimeout);
            }

            setDebounceTimeout(
                setTimeout(() => _changeInputTradePrice(amount), DEBOUNCE_DELAY),
            );
        }
    };

    const _changeInputTradePrice = async (amount: string) => {
        const success = await changeTradePrice(amount, TradeDirection.input);
        if (success) {
            setOutputValue(
                uniswapDappSharedLogic!.tradeContext!.expectedConvertQuote,
            );
        } else {
            setOutputValue('');
        }
    };

    const changeOutputTradePrice = async (amount: string) => {
        if (isValidDecimalLength(amount, outputToken!)) {
            setOutputValue(amount);
            if (!amount || new BigNumber(amount).isEqualTo(0)) {
                setInputValue('');
                if (debounceTimeout) {
                    clearTimeout(debounceTimeout);
                }
                return;
            }

            if (debounceTimeout) {
                clearTimeout(debounceTimeout);
            }

            setDebounceTimeout(
                setTimeout(() => _changeOutputTradePrice(amount), DEBOUNCE_DELAY),
            );
        }
    };

    const _changeOutputTradePrice = async (amount: string) => {
        const success = await changeTradePrice(amount, TradeDirection.output);

        if (success) {
            setInputValue(uniswapDappSharedLogic!.tradeContext!.expectedConvertQuote);
        } else {
            setInputValue('');
        }
    };

    const isValidDecimalLength = (value: string, token: ExtendedToken) => {
        const decimals = value.split('.');
        if (!decimals[1]) {
            return true;
        }
        if (value.length > token.decimals) {
            return false;
        }

        return true;
    };

    /**
     * Change trade price
     * @param amount The amount
     * @param tradeDirection The trade direction
     */
    const changeTradePrice = async (
        amount: string,
        tradeDirection: TradeDirection,
    ) => {
        try {
            await uniswapDappSharedLogic!.changeTradePrice(amount, tradeDirection);
        } catch (error : any) {
            if (error?.code === ErrorCodes.noRoutesFound) {
                handleNoLiquidityFound(true, tradeDirection);
                return false;
            }
        }

        handleNoLiquidityFound(false, tradeDirection);

        return true;
    };

    const switchSwap = async () => {
        if (noLiquidityFound) {
            return;
        }
        const swapState = await uniswapDappSharedLogic!.swapSwitch();
        setInputValue(swapState.inputValue);
        setOutputValue(swapState.outputValue);
    };

    const handleNoLiquidityFound = (
        noLiquidityFound: boolean,
        tradeDirection: TradeDirection | undefined,
    ) => {
        setNoLiquidityFound(noLiquidityFound);
        if (noLiquidityFound && tradeDirection) {
            if (tradeDirection === TradeDirection.input) {
                setOutputValue('');
            } else {
                setInputValue('');
            }
        }
    };

    return (
        <div id="uniswap__716283642843643826">
            {loading && <Loading />}

            {!loading && uniswapDappSharedLogic && (
                <div>
                    <div className="uni-ic uni-ic__theme-background">
                        {supportedNetwork && inputToken && (
                            <div>
                                <Header
                                    uniswapDappSharedLogic={uniswapDappSharedLogic}
                                    disableMultihopsCompleted={(noLiquidityFound: boolean) => {
                                        handleNoLiquidityFound(
                                            noLiquidityFound,
                                            tradeContext?.quoteDirection,
                                        );
                                    }}
                                />
                                <div className="uni-ic__swap-container">
                                    <div className="uni-ic__swap-content">
                                        <div className="uni-ic__swap-input-container">
                                            <div className="uni-ic__swap-input-content uni-ic__theme-panel">
                                                <div className="uni-ic__swap-input-content-main">
                                                    <Button
                                                        className="uni-ic__swap-input-content-main-from-currency-container uni-ic__theme-panel"
                                                        onClick={() =>
                                                            uniswapDappSharedLogic!.openTokenSelectorFrom()
                                                        }
                                                    >
                                                        <span className="uni-ic__swap-input-content-main-from-currency">
                                                            <TokenIcon
                                                                classes="uni-ic__swap-input-content-main-from-currency-icon"
                                                                tokenImageContext={inputToken.tokenImageContext}
                                                            />

                                                            <span className="uni-ic__swap-input-content-main-from-currency-symbol">
                                                                {inputToken.symbol}
                                                            </span>
                                                            <svg
                                                                width="12"
                                                                height="7"
                                                                viewBox="0 0 12 7"
                                                                fill="none"
                                                                className="uni-ic__swap-input-content-main-from-currency-choose"
                                                            >
                                                                <path
                                                                    d="M0.97168 1L6.20532 6L11.439 1"
                                                                    stroke="#AEAEAE"
                                                                ></path>
                                                            </svg>
                                                        </span>
                                                    </Button>
                                                    <input
                                                        className="uni-ic__swap-input-content-main-from uni-ic__theme-panel"
                                                        autoComplete="off"
                                                        autoCorrect="off"
                                                        type="number"
                                                        step="any"
                                                        placeholder="0.0"
                                                        maxLength={inputToken.decimals}
                                                        value={inputValue}
                                                        onChange={(e) => {
                                                            changeInputTradePrice(e.target.value);
                                                        }}
                                                        disabled={uniswapDappSharedLogic.transactionInProcess()}
                                                        spellCheck="false"
                                                    />
                                                </div>
                                                <div className="uni-ic__swap-content-balance-and-price-container">
                                                    <div className="uni-ic__swap-content-balance-and-price">
                                                        <div className="uni-ic__swap-content-balance-and-price__balance">
                                                            <div className="uni-ic__swap-content-balance-and-price__balance-text">
                                                                <span>
                                                                    Balance: {inputBalance} {inputToken.symbol}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        {inputValue && inputFiatPrice && (
                                                            <div className="uni-ic__swap-content-balance-and-price__price">
                                                                ~$
                                                                <span className="uni-ic__swap-content-balance-and-price__price-text">
                                                                    {utils.formatCurrency(
                                                                        inputFiatPrice.times(inputValue).toFixed(),
                                                                    )}
                                                                </span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div
                                            className="uni-ic__swap-divider uni-ic__theme-panel"
                                            onClick={() => switchSwap()}
                                        >
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                width="16"
                                                height="16"
                                                viewBox="0 0 24 24"
                                                fill="none"
                                                stroke="#000000"
                                                strokeWidth="2"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                            >
                                                <line x1="12" y1="5" x2="12" y2="19"></line>
                                                <polyline points="19 12 12 19 5 12"></polyline>
                                            </svg>
                                        </div>

                                        <div className="uni-ic__swap-output-container">
                                            <div className="uni-ic__swap-output-content uni-ic__theme-panel">
                                                <div className="uni-ic__swap-output-content-main">
                                                    <Button
                                                        className="uni-ic__swap-output-content-main-select uni-ic__theme-panel"
                                                        onClick={() =>
                                                            uniswapDappSharedLogic!.openTokenSelectorTo()
                                                        }
                                                    >
                                                        {!outputToken && (
                                                            <span className="uni-ic__swap-output-content-main-select-content">
                                                                <span className="uni-ic__swap-output-content-main-select-content-title">
                                                                    Select a token
                                                                </span>
                                                                <svg
                                                                    width="12"
                                                                    height="7"
                                                                    viewBox="0 0 12 7"
                                                                    fill="none"
                                                                    className="uni-ic__swap-output-content-main-select-content-icon"
                                                                >
                                                                    <path
                                                                        d="M0.97168 1L6.20532 6L11.439 1"
                                                                        stroke="#AEAEAE"
                                                                    ></path>
                                                                </svg>
                                                            </span>
                                                        )}

                                                        {outputToken && (
                                                            <span className="uni-ic__swap-input-content-main-from-currency">
                                                                <TokenIcon
                                                                    classes="uni-ic__swap-input-content-main-from-currency-icon"
                                                                    tokenImageContext={
                                                                        outputToken.tokenImageContext
                                                                    }
                                                                />

                                                                <span className="uni-ic__swap-input-content-main-from-currency-symbol">
                                                                    {outputToken.symbol}
                                                                </span>
                                                                <svg
                                                                    width="12"
                                                                    height="7"
                                                                    viewBox="0 0 12 7"
                                                                    fill="none"
                                                                    className="uni-ic__swap-input-content-main-from-currency-choose"
                                                                >
                                                                    <path
                                                                        d="M0.97168 1L6.20532 6L11.439 1"
                                                                        stroke="#AEAEAE"
                                                                    ></path>
                                                                </svg>
                                                            </span>
                                                        )}
                                                    </Button>
                                                    <input
                                                        className="uni-ic__swap-output-content-main-from uni-ic__theme-panel"
                                                        autoComplete="off"
                                                        autoCorrect="off"
                                                        type="number"
                                                        step="any"
                                                        placeholder="0.0"
                                                        maxLength={outputToken?.decimals}
                                                        value={outputValue}
                                                        onChange={(e) => {
                                                            changeOutputTradePrice(e.target.value);
                                                        }}
                                                        disabled={uniswapDappSharedLogic.transactionInProcess()}
                                                        spellCheck="false"
                                                    />
                                                </div>
                                                {outputToken && (
                                                    <div className="uni-ic__swap-content-balance-and-price-container">
                                                        <div className="uni-ic__swap-content-balance-and-price">
                                                            <div className="uni-ic__swap-content-balance-and-price__balance">
                                                                <div className="uni-ic__swap-content-balance-and-price__balance-text">
                                                                    <span>
                                                                        Balance: {outputBalance}{' '}
                                                                        {outputToken!.symbol}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                            {outputValue && outputFiatPrice && (
                                                                <div className="uni-ic__swap-content-balance-and-price__price">
                                                                    ~$
                                                                    <span className="uni-ic__swap-content-balance-and-price__price-text">
                                                                        {utils.formatCurrency(
                                                                            outputFiatPrice
                                                                                .times(outputValue)
                                                                                .toFixed(),
                                                                        )}
                                                                    </span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    {tradeContext && !noLiquidityFound && (
                                        <React.Fragment>
                                            <SwapQuoteInfo
                                                uniswapDappSharedLogic={uniswapDappSharedLogic}
                                                tradeContext={tradeContext}
                                            />

                                            <Approval
                                                uniswapDappSharedLogic={uniswapDappSharedLogic}
                                                tradeContext={tradeContext}
                                                miningTransaction={miningTransaction}
                                                miningTransactionStatus={miningTransactionStatus}
                                            />
                                        </React.Fragment>
                                    )}
                                    <div className="uni-ic__swap-button-container">
                                        <Button
                                            className="uni-ic__swap-button uni-ic__theme-background-button"
                                            onClick={() => uniswapDappSharedLogic!.showConfirmSwap()}
                                            disabled={
                                                utils.isZero(outputValue) ||
                                                uniswapDappSharedLogic.tradeContext
                                                    ?.hasEnoughAllowance === false ||
                                                uniswapDappSharedLogic.tradeContext?.fromBalance
                                                    ?.hasEnough === false ||
                                                noLiquidityFound
                                            }
                                        >
                                            <div className="uni-ic__swap-button-text">
                                                {utils.isZero(outputValue) && !noLiquidityFound && (
                                                    <span>Enter an amount</span>
                                                )}

                                                {!utils.isZero(outputValue) &&
                                                    !noLiquidityFound &&
                                                    uniswapDappSharedLogic.tradeContext?.fromBalance
                                                        ?.hasEnough && <span>Swap</span>}

                                                {!utils.isZero(outputValue) &&
                                                    !noLiquidityFound &&
                                                    !uniswapDappSharedLogic.tradeContext?.fromBalance
                                                        ?.hasEnough && (
                                                        <span>
                                                            Insufficient{' '}
                                                            {
                                                                uniswapDappSharedLogic.tradeContext?.fromToken
                                                                    ?.symbol
                                                            }{' '}
                                                            balance
                                                        </span>
                                                    )}

                                                {noLiquidityFound && (
                                                    <span>Insufficient liquidity for this trade</span>
                                                )}
                                            </div>
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {!supportedNetwork && (
                            <div className="uni-ic__error">
                                <p>
                                    <strong>Chain id {chainId} is a unsupported network.</strong>
                                </p>
                            </div>
                        )}
                    </div>

                    <TokensModal
                        uniswapDappSharedLogic={uniswapDappSharedLogic}
                        switchSwapCompleted={(swapCompleted: SwapSwitchResponse) => {
                            setInputValue(swapCompleted.inputValue);
                            setOutputValue(swapCompleted.outputValue);
                        }}
                        changeTokenCompleted={(noLiquidityFound: boolean) => {
                            handleNoLiquidityFound(
                                noLiquidityFound,
                                tradeContext?.quoteDirection,
                            );
                        }}
                        selectorOpenFrom={selectorOpenFrom!}
                        inputToken={inputToken!}
                        outputToken={outputToken}
                    />

                    <ConfirmSwap
                        uniswapDappSharedLogic={uniswapDappSharedLogic}
                        tradeContext={tradeContext}
                        newPriceTradeContext={newPriceTradeContext}
                        inputFiatPrice={inputFiatPrice}
                        outputFiatPrice={outputFiatPrice}
                    />
                    <TransactionModal
                        uniswapDappSharedLogic={uniswapDappSharedLogic}
                        miningTransactionStatus={miningTransactionStatus}
                    />
                </div>
            )}
        </div>
    );
};

export default UniswapReact;
