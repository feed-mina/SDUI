import { render, screen, fireEvent } from '@testing-library/react';
import DynamicEngine from '../../../metadata-project/components/DynamicEngine';

test('필수 입력값이 없으면 경고 메시지가 출력되는지 테스트', () => {
    const mockData = [{
        component_id: 'login_btn',
        label_text: '로그인',
        component_type: 'BUTTON', // 이 글자가 componentMap의 키와 같아야 함
        sort_order: 1,
        action_type: 'SUBMIT'
    }];
// 가짜 함수(Mock function)를 만듭니다.
    const mockOnAction = jest.fn();
    const mockOnChange = jest.fn();
    const loginBtn = screen.getByText(/로그인/);
    fireEvent.click(loginBtn);
    render(
        <DynamicEngine
            metadata={mockData}
            onAction={mockOnAction}
            onChange={mockOnChange}
        />
    );
    // render(<DynamicEngine metadata={mockData} />);
    // 버튼 찾기 (정규표현식을 쓰면 대소문자나 공백에 조금 더 유연합니다)
});
test('DB의 CSS 클래스가 버튼에 잘 입혀지는지 확인', () => {
    const mockData = [{
        component_id: 'login_btn',
        label_text: '로그인',
        component_type: 'BUTTON',
        className: 'diary-nav1' // 민아 님의 기존 CSS 클래스명
    }];

    render(<DynamicEngine metadata={mockData} />);

    const loginBtn = screen.getByText(/로그인/);

    // 클래스명이 'diary-nav1'인지 확인합니다.
    expect(loginBtn).toHaveClass('diary-nav1');
});
test('이메일을 입력하면 데이터 바구니에 저장되는지 확인', () => {
    const mockData = [{
        component_id: 'user_email',
        label_text: 'Email',
        component_type: 'INPUT'
    }, {
        component_id: 'login_btn',
        label_text: '로그인',
        component_type: 'BUTTON',
        action_type: 'SUBMIT'
    }];

    render(<DynamicEngine metadata={mockData} />);

    const input = screen.getByLabelText(/Email/);

    // 사용자가 'mina@example.com'이라고 치는 시뮬레이션
    fireEvent.change(input, { target: { value: 'mina@example.com' } });

    const loginBtn = screen.getByText(/로그인/);
    fireEvent.click(loginBtn);

    // 이제 콘솔 로그에 { user_email: 'mina@example.com' }이 찍히는지 확인합니다.
});