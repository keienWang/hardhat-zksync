import { buildAssert } from '@nomicfoundation/hardhat-chai-matchers/utils';

import { toBeHex } from 'ethers';
import { decodeReturnData, getReturnDataFromError } from './utils';

export function supportRevertedWith(Assertion: Chai.AssertionStatic) {
    Assertion.addMethod('revertedWith', function (this: any, expectedReason: unknown) {
        const negated = this.__flags.negate;

        if (typeof expectedReason !== 'string') {
            throw new TypeError('Expected the revert reason to be a string');
        }

        const onSuccess = () => {
            const assert = buildAssert(negated, onSuccess);

            assert(false, `Expected transaction to be reverted with reason '${expectedReason}', but it didn't revert`);
        };

        const onError = (error: any) => {
            const assert = buildAssert(negated, onError);

            const returnData = getReturnDataFromError(error);
            const decodedReturnData = decodeReturnData(returnData);

            if (decodedReturnData.kind === 'Empty') {
                assert(
                    false,
                    `Expected transaction to be reverted with reason '${expectedReason}', but it reverted without a reason`,
                );
            } else if (decodedReturnData.kind === 'Error') {
                assert(
                    decodedReturnData.reason === expectedReason,
                    `Expected transaction to be reverted with reason '${expectedReason}', but it reverted with reason '${decodedReturnData.reason}'`,
                    `Expected transaction NOT to be reverted with reason '${expectedReason}', but it was`,
                );
            } else if (decodedReturnData.kind === 'Panic') {
                assert(
                    false,
                    `Expected transaction to be reverted with reason '${expectedReason}', but it reverted with panic code ${toBeHex(
                        decodedReturnData.code,
                    )} (${decodedReturnData.description})`,
                );
            } else if (decodedReturnData.kind === 'Custom') {
                assert(
                    false,
                    `Expected transaction to be reverted with reason '${expectedReason}', but it reverted with a custom error`,
                );
            } else {
                const _exhaustiveCheck: never = decodedReturnData;
            }
        };

        const derivedPromise = Promise.resolve(this._obj).then(onSuccess, onError);

        this.then = derivedPromise.then.bind(derivedPromise);
        this.catch = derivedPromise.catch.bind(derivedPromise);

        return this;
    });
}
