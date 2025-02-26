<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20250224211809 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Remove roles from user table';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('ALTER TABLE "user" DROP roles');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE "user" ADD roles JSON NOT NULL');
        $this->addSql('UPDATE "user" SET roles = \'["ROLE_USER"]\'');
    }
}
