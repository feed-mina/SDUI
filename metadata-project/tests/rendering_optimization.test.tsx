import React from 'react';
import {MetadataProvider} from "@/components/MetadataProvider";
import {renderWithProviders} from "@/tests/test-utils";
import { render, screen, fireEvent } from '@testing-library/react';
import {logTestSuccess} from "@/tests/TestLogger";

test('자식 입력창에 글자 입력 시 부모 엔진의 리렌더링 횟수 검증', async () => {
    // 1. 콘솔 로그를 감시하는 스파이(Spy)를 생성한다.
    const consoleSpy = jest.spyOn(console, 'log');

    // @@@@   실제 InputField가 렌더링되도록 Mock 메타데이터 구성
    const mockMetadata = {
        screenId: "HOME_PAGE",
        children: [
            {
                id: "test-field",
                component_type: "INPUT", // componentMap에서 INPUT을 찾아 렌더링함
                component_props: { placeholder: "입력해주세요" }
            }
        ]
    };

    //   MetadataProvider에 mockMetadata를 강제로 주입 (구현 방식에 따라 props 전달)
    renderWithProviders(
        <MetadataProvider screenId="HOME_PAGE">
            {/* DynamicEngine이 내부적으로 InputField를 그리게 됨 */}
            <div />
        </MetadataProvider>
    );
    // 3. 입력창에 글자를 입력하는 이벤트를 발생시킨다.
    const input = screen.getByTestId('test-input');
    fireEvent.change(input, { target: { value: 'A' } });
    fireEvent.change(input, { target: { value: 'AB' } });

    // 4. 로그를 분석하여 렌더링 횟수를 체크한다.  부모(DynamicEngine) 로그가 1번(초기 렌더링)만 찍혔는지 확인한다
    const engineRenderLogs = consoleSpy.mock.calls.filter(call =>
        call[0].includes('DynamicEngine 렌더링 횟수')
    );

    const childRenderLogs = consoleSpy.mock.calls.filter(call =>
        call[0].includes('InputField 렌더링 횟수')
    );

    // 5. 검증: 최적화가 잘 되었다면 입력 시 부모 엔진의 렌더링은 늘어나지 않아야 한다.
    // 첫 렌더링 1회를 제외하고 추가 렌더링이 없어야 함 (상황에 따라 1회로 고정)
    expect(engineRenderLogs.length).toBeLessThanOrEqual(1);

    // 자식 컴포넌트는 입력한 횟수만큼 정상적으로 그려져야 함
    expect(childRenderLogs.length).toBeGreaterThan(1);
    // @@@@ 성공 기록 및 지표 로깅
    logTestSuccess(`Rendering Optimization - Engine Count: ${engineRenderLogs.length}, Child Count: ${childRenderLogs.length}`);
    consoleSpy.mockRestore();
});