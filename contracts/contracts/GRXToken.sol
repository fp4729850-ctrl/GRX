// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title GRXToken
 * @dev Gold-backed token (GRX) with certificate-based minting and invoice-based burning
 * @notice This contract implements the BRICSPAY Global token specification
 */
contract GRXToken is ERC20, AccessControl, ReentrancyGuard {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant BURNER_ROLE = keccak256("BURNER_ROLE");
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");

    // Certificate tracking
    mapping(bytes32 => bool) public certUsed;
    mapping(bytes32 => address) public certMinter;
    mapping(bytes32 => uint256) public certAmount;
    uint256 public totalCertificatesUsed;

    // Invoice tracking
    mapping(bytes32 => bool) public invoiceUsed;
    mapping(bytes32 => address) public invoiceBurner;
    mapping(bytes32 => uint256) public invoiceAmount;
    uint256 public totalInvoicesUsed;

    // Minting and burning counters
    mapping(address => uint256) public mintedBy;
    mapping(address => uint256) public burnedBy;
    uint256 public totalMinted;
    uint256 public totalBurned;

    // Events
    event MintedWithCert(
        bytes32 indexed certId,
        address indexed to,
        uint256 amount,
        string metadata,
        address indexed minter
    );

    event BurnedWithInvoice(
        bytes32 indexed invoiceId,
        address indexed from,
        uint256 amount,
        address indexed burner
    );

    event AdminBurnedWithInvoice(
        bytes32 indexed invoiceId,
        address indexed from,
        uint256 amount,
        address indexed admin
    );

    event InvoiceCreated(
        bytes32 indexed invoiceId,
        address indexed recipient,
        uint256 amount
    );

    /**
     * @dev Constructor sets up the token with 18 decimals and grants roles
     * @param _defaultAdmin Address to receive DEFAULT_ADMIN_ROLE
     * @param _minter Address to receive MINTER_ROLE (should be multisig in production)
     */
    constructor(
        address _defaultAdmin,
        address _minter
    ) ERC20("GRX Global", "GRX") {
        require(_defaultAdmin != address(0), "GRX: invalid admin");
        require(_minter != address(0), "GRX: invalid minter");

        _grantRole(DEFAULT_ADMIN_ROLE, _defaultAdmin);
        _grantRole(MINTER_ROLE, _minter);
        _grantRole(ADMIN_ROLE, _defaultAdmin);
    }

    /**
     * @dev Mint tokens with a certificate ID
     * @param certId Unique certificate identifier (keccak256 hash of certificate data)
     * @param to Address to receive the minted tokens
     * @param amount Amount of tokens to mint (in wei, 18 decimals)
     * @param metadata Optional metadata string (can be IPFS hash or JSON)
     */
    function mintWithCert(
        bytes32 certId,
        address to,
        uint256 amount,
        string memory metadata
    ) external onlyRole(MINTER_ROLE) nonReentrant {
        require(certId != bytes32(0), "GRX: invalid certId");
        require(to != address(0), "GRX: invalid recipient");
        require(amount > 0, "GRX: amount must be > 0");
        require(!certUsed[certId], "GRX: certificate already used");

        // Mark certificate as used
        certUsed[certId] = true;
        certMinter[certId] = msg.sender;
        certAmount[certId] = amount;
        totalCertificatesUsed++;

        // Update counters
        mintedBy[msg.sender] += amount;
        totalMinted += amount;

        // Mint tokens
        _mint(to, amount);

        // Emit event
        emit MintedWithCert(certId, to, amount, metadata, msg.sender);
    }

    /**
     * @dev Burn tokens with an invoice ID (user-initiated)
     * @param invoiceId Unique invoice identifier
     * @param amount Amount of tokens to burn
     */
    function burnWithInvoice(
        bytes32 invoiceId,
        uint256 amount
    ) external nonReentrant {
        require(invoiceId != bytes32(0), "GRX: invalid invoiceId");
        require(amount > 0, "GRX: amount must be > 0");
        require(!invoiceUsed[invoiceId], "GRX: invoice already used");
        require(balanceOf(msg.sender) >= amount, "GRX: insufficient balance");

        // Mark invoice as used
        invoiceUsed[invoiceId] = true;
        invoiceBurner[invoiceId] = msg.sender;
        invoiceAmount[invoiceId] = amount;
        totalInvoicesUsed++;

        // Update counters
        burnedBy[msg.sender] += amount;
        totalBurned += amount;

        // Burn tokens
        _burn(msg.sender, amount);

        // Emit event
        emit BurnedWithInvoice(invoiceId, msg.sender, amount, msg.sender);
    }

    /**
     * @dev Admin burn tokens with an invoice ID (for custodial wallets)
     * @param from Address to burn tokens from
     * @param invoiceId Unique invoice identifier
     * @param amount Amount of tokens to burn
     */
    function adminBurnWithInvoice(
        address from,
        bytes32 invoiceId,
        uint256 amount
    ) external onlyRole(BURNER_ROLE) nonReentrant {
        require(from != address(0), "GRX: invalid from address");
        require(invoiceId != bytes32(0), "GRX: invalid invoiceId");
        require(amount > 0, "GRX: amount must be > 0");
        require(!invoiceUsed[invoiceId], "GRX: invoice already used");
        require(balanceOf(from) >= amount, "GRX: insufficient balance");

        // Mark invoice as used
        invoiceUsed[invoiceId] = true;
        invoiceBurner[invoiceId] = from;
        invoiceAmount[invoiceId] = amount;
        totalInvoicesUsed++;

        // Update counters
        burnedBy[from] += amount;
        totalBurned += amount;

        // Burn tokens
        _burn(from, amount);

        // Emit event
        emit AdminBurnedWithInvoice(invoiceId, from, amount, msg.sender);
    }

    /**
     * @dev Create an invoice event (optional, for tracking)
     * @param invoiceId Unique invoice identifier
     * @param recipient Address that will receive the invoice
     * @param amount Amount associated with the invoice
     */
    function createInvoice(
        bytes32 invoiceId,
        address recipient,
        uint256 amount
    ) external onlyRole(ADMIN_ROLE) {
        require(invoiceId != bytes32(0), "GRX: invalid invoiceId");
        require(recipient != address(0), "GRX: invalid recipient");
        require(amount > 0, "GRX: amount must be > 0");

        emit InvoiceCreated(invoiceId, recipient, amount);
    }

    /**
     * @dev Get certificate information
     * @param certId Certificate ID to query
     * @return used Whether the certificate has been used
     * @return minter Address that minted with this certificate
     * @return amount Amount minted with this certificate
     */
    function getCertificateInfo(
        bytes32 certId
    ) external view returns (bool used, address minter, uint256 amount) {
        return (certUsed[certId], certMinter[certId], certAmount[certId]);
    }

    /**
     * @dev Get invoice information
     * @param invoiceId Invoice ID to query
     * @return used Whether the invoice has been used
     * @return burner Address that burned with this invoice
     * @return amount Amount burned with this invoice
     */
    function getInvoiceInfo(
        bytes32 invoiceId
    ) external view returns (bool used, address burner, uint256 amount) {
        return (invoiceUsed[invoiceId], invoiceBurner[invoiceId], invoiceAmount[invoiceId]);
    }

    /**
     * @dev Get minting statistics for an address
     * @param minter Address to query
     * @return totalMinted Total amount minted by this address
     */
    function getMintingStats(address minter) external view returns (uint256) {
        return mintedBy[minter];
    }

    /**
     * @dev Get burning statistics for an address
     * @param burner Address to query
     * @return totalBurned Total amount burned by this address
     */
    function getBurningStats(address burner) external view returns (uint256) {
        return burnedBy[burner];
    }

    /**
     * @dev Override decimals to return 18
     */
    function decimals() public pure override returns (uint8) {
        return 18;
    }
}


