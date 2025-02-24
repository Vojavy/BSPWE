<?php

namespace App\Entity;

use App\Repository\DomainRepository;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: DomainRepository::class)]
class Domain
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\Column(length: 255)]
    private ?string $domainName = null;

    #[ORM\ManyToOne(targetEntity: User::class)]
    #[ORM\JoinColumn(nullable: false)]
    private ?User $owner = null;

    #[ORM\Column(type: 'json')]
    private array $connectionDetails = [];

    #[ORM\Column(length: 255)]
    private ?string $ftpPassword = null;

    #[ORM\Column(type: 'datetime')]
    private ?\DateTimeInterface $createdAt = null;

    public function __construct()
    {
        $this->createdAt = new \DateTime();
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getDomainName(): ?string
    {
        return $this->domainName;
    }

    public function setDomainName(string $domainName): static
    {
        $this->domainName = $domainName;
        return $this;
    }

    public function getOwner(): ?User
    {
        return $this->owner;
    }

    public function setOwner(?User $owner): static
    {
        $this->owner = $owner;
        return $this;
    }

    public function getConnectionDetails(): array
    {
        return $this->connectionDetails;
    }

    public function setConnectionDetails(array $connectionDetails): static
    {
        $this->connectionDetails = $connectionDetails;
        return $this;
    }

    public function getFtpPassword(): ?string
    {
        return $this->ftpPassword;
    }

    public function setFtpPassword(string $ftpPassword): static
    {
        $this->ftpPassword = $ftpPassword;
        return $this;
    }

    public function getCreatedAt(): ?\DateTimeInterface
    {
        return $this->createdAt;
    }

    public function setCreatedAt(\DateTimeInterface $createdAt): static
    {
        $this->createdAt = $createdAt;
        return $this;
    }
} 