// SPDX-License-Identifier: MIT
pragma solidity ^0.8.12;

interface IKelpToken {
    function balanceOf(address _owner) external view returns (uint256 balance);

    function allowance(address _owner, address _spender)
        external
        view
        returns (uint256);

    function transfer(address _to, uint256 _value) external returns (bool);

    function transferFrom(
        address _from,
        address _to,
        uint256 _value
    ) external returns (bool);

    function approve(address _spender, uint256 _value) external returns (bool);

    function increaseApproval(address _spender, uint256 _addedValue)
        external
        returns (bool);

    function decreaseApproval(address _spender, uint256 _subtractedValue)
        external
        returns (bool);
}
