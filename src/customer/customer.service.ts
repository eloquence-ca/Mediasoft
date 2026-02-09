import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Address } from 'src/address/entities/address.entity';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { Contact } from 'src/contact/entities/contact.entity';
import { InternalNote } from 'src/internal-note/entities/internal-note.entity';
import { NumberingCustomer } from 'src/numbering/entities/numbering-customer.entity';
import {
  DefaultFormats,
  NumberingCustomerService,
} from 'src/numbering/numbering-customer.service';
import { DeepPartial, EntityManager, QueryRunner, Repository } from 'typeorm';
import { CreateCompleteCustomerDto } from './dto/create-complete-customer.dto';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { CustomerIndividual } from './entities/customer-individual.entity';
import { CustomerProfessional } from './entities/customer-professional.entity';
import { CustomerPublicEntity } from './entities/customer-public-entity.entity';
import { Customer, TYPE_CUSTOMER } from './entities/customer.entity';
import { AddressDto } from 'src/address/dto/address.dto';

@Injectable()
export class CustomerService {
  constructor(
    @InjectRepository(Customer)
    private readonly customerRepository: Repository<Customer>,
    @InjectRepository(CustomerIndividual)
    private readonly customerIndividualRepository: Repository<CustomerIndividual>,
    @InjectRepository(CustomerProfessional)
    private readonly customerProfessionalRepository: Repository<CustomerProfessional>,
    @InjectRepository(CustomerPublicEntity)
    private readonly customerPublicEntityRepository: Repository<CustomerPublicEntity>,
    @InjectRepository(Address)
    private readonly addressRepository: Repository<Address>,
    @InjectRepository(Contact)
    private readonly contactRepository: Repository<Contact>,
    @InjectRepository(InternalNote)
    private readonly internalNoteRepository: Repository<InternalNote>,
    private readonly numberingService: NumberingCustomerService,
  ) {}

  async create(dto: CreateCompleteCustomerDto): Promise<Customer> {
    const queryRunner =
      this.customerRepository.manager.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const savedCustomer = await this.createBaseCustomer(dto, queryRunner);

      await this.createCustomerRelations(savedCustomer.id, dto, queryRunner);

      await this.createCustomerTypeEntity(
        queryRunner.manager,
        savedCustomer.id,
        dto.type,
        dto,
      );

      await queryRunner.commitTransaction();
      return await this.findOneWithDetails(savedCustomer.id);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  private async generateCode(
    idDirectory: string,
    queryRunner: QueryRunner,
  ): Promise<string> {
    let code = '';

    let numbering: NumberingCustomer | null;
    let isNew = false;
    numbering =
      await this.numberingService.findCustomerByDirectory(idDirectory);

    if (!numbering) {
      isNew = true;
      numbering = await this.numberingService.create(
        {
          idCustomerDirectory: idDirectory,
          format: DefaultFormats.CUSTOMER,
          counter: 1,
        },
        queryRunner,
      );
    }

    let exists = true;
    while (exists) {
      code = isNew
        ? this.numberingService.formatNumber(DefaultFormats.CUSTOMER, 1)
        : (await this.numberingService.getNextNumber(numbering.id))
            .formattedNumber;

      const existingCustomer = await this.customerRepository.findOne({
        where: {
          code,
          idDirectory,
        },
      });

      exists = !!existingCustomer;
    }

    return code;
  }

  private async createBaseCustomer(
    dto: CreateCompleteCustomerDto,
    queryRunner: QueryRunner,
  ): Promise<Customer> {
    const code = await this.generateCode(dto.idDirectory, queryRunner);

    const customer = this.customerRepository.create({
      idDirectory: dto.idDirectory,
      idConditionRegulation: dto.idConditionRegulation,
      idTvaRate: dto.idTvaRate,
      code: code,
      email: dto.email,
      phone: dto.phone,
      origine: dto.origine,
      type: dto.type,
      status: dto.status,
    } as DeepPartial<Customer>);

    const savedCustomer = await queryRunner.manager.save(customer);

    if (dto.headAddress) {
      const headAddress = this.addressRepository.create({
        ...dto.headAddress,
      });
      headAddress.customerHead = savedCustomer;
      if (dto.useSameAddressForBilling) {
        headAddress.customerBilling = savedCustomer;
      }
      await queryRunner.manager.save(headAddress);
    }

    if (dto.billingAddress) {
      const billingAddress = this.addressRepository.create({
        ...dto.billingAddress,
      });

      billingAddress.customerBilling = savedCustomer;
      await queryRunner.manager.save(billingAddress);
    }
    return savedCustomer;
  }

  private async createCustomerRelations(
    customerId: string,
    dto: CreateCompleteCustomerDto,
    queryRunner: QueryRunner,
  ): Promise<void> {
    await this.saveEntitiesIfAny(
      dto.workAddresses,
      this.addressRepository,
      customerId,
      queryRunner,
    );
    await this.saveEntitiesIfAny(
      dto.contacts,
      this.contactRepository,
      customerId,
      queryRunner,
    );
    await this.saveEntitiesIfAny(
      dto.internalNotes,
      this.internalNoteRepository,
      customerId,
      queryRunner,
    );
  }

  private async saveEntitiesIfAny<T>(
    items: T[] | undefined,
    repository: Repository<any>,
    customerId: string,
    queryRunner: QueryRunner,
  ) {
    if (items?.length) {
      for (const item of items) {
        const entity = repository.create({ ...item, idCustomer: customerId });
        await queryRunner.manager.save(entity);
      }
    }
  }

  private async createCustomerTypeEntity(
    manager: any,
    customerId: string,
    type: TYPE_CUSTOMER,
    createCustomerDto: CreateCustomerDto | CreateCompleteCustomerDto,
  ): Promise<void> {
    switch (type) {
      case TYPE_CUSTOMER.INDIVIDUAL: {
        if (!createCustomerDto.individual) {
          throw new BadRequestException(
            'Les données individuelles sont requises pour un client particulier',
          );
        }
        const individual = this.customerIndividualRepository.create({
          idCustomer: customerId,
          ...createCustomerDto.individual,
        });
        await manager.save(individual);
        break;
      }

      case TYPE_CUSTOMER.PROFESSIONAL: {
        if (!createCustomerDto.professional) {
          throw new BadRequestException(
            'Les données professionnelles sont requises pour un client professionnel',
          );
        }
        const professional = this.customerProfessionalRepository.create({
          idCustomer: customerId,
          ...createCustomerDto.professional,
        });
        await manager.save(professional);
        break;
      }

      case TYPE_CUSTOMER.PUBLIC_ENTITY: {
        if (!createCustomerDto.publicEntity) {
          throw new BadRequestException(
            "Les données d'entité publique sont requises pour un client organisme public",
          );
        }
        const publicEntity = this.customerPublicEntityRepository.create({
          idCustomer: customerId,
          ...createCustomerDto.publicEntity,
        });
        await manager.save(publicEntity);
        break;
      }

      default:
        throw new BadRequestException('Type de client invalide');
    }
  }

  async findAll(paginationDto: PaginationDto = {}) {
    const { page = 1, limit = 10, search } = paginationDto;
    const skip = (page - 1) * limit;

    const queryBuilder = this.customerRepository
      .createQueryBuilder('customer')
      .leftJoinAndSelect('customer.directory', 'directory')
      .leftJoinAndSelect('customer.individual', 'individual')
      .leftJoinAndSelect('customer.professional', 'professional')
      .leftJoinAndSelect('customer.publicEntity', 'publicEntity')
      .leftJoinAndSelect('customer.conditionRegulation', 'conditionRegulation')
      .leftJoinAndSelect('customer.tvaRate', 'tvaRate');

    if (search) {
      queryBuilder.where(
        `(customer.code ILIKE :search OR 
         customer.email ILIKE :search OR
         individual.firstname ILIKE :search OR
         individual.lastname ILIKE :search OR
         professional.companyName ILIKE :search OR
         publicEntity.entityName ILIKE :search)`,
        { search: `%${search}%` },
      );
    }

    const [customers, total] = await queryBuilder
      .skip(skip)
      .take(limit)
      .orderBy('customer.createdAt', 'DESC')
      .getManyAndCount();

    return {
      data: customers,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findByDirectory(directoryId: string): Promise<Customer[]> {
    return await this.customerRepository.find({
      where: { idDirectory: directoryId },
      relations: [
        'individual',
        'professional',
        'publicEntity',
        'conditionRegulation',
        'tvaRate',
      ],
    });
  }

  async findCustomersByCompanyId(companyId: string): Promise<Customer[]> {
    return await this.customerRepository
      .createQueryBuilder('customer')
      .innerJoin('customer.directory', 'directory')
      .innerJoin('directory.directoryCompanies', 'dc')
      .leftJoinAndSelect('customer.individual', 'individual')
      .leftJoinAndSelect('customer.professional', 'professional')
      .leftJoinAndSelect('customer.publicEntity', 'publicEntity')
      .leftJoinAndSelect('customer.headAddress', 'headAddress')
      .leftJoinAndSelect('customer.billingAddress', 'billingAddress')
      .leftJoinAndSelect('customer.workAddresses', 'workAddresses')
      .where('dc.idCompany = :companyId', { companyId })
      .orderBy('customer.createdAt', 'DESC')
      .getMany();
  }

  async findByType(type: TYPE_CUSTOMER): Promise<Customer[]> {
    return await this.customerRepository.find({
      where: { type },
      relations: ['individual', 'professional', 'publicEntity', 'directory'],
    });
  }

  /**
   * Recherche avancée de clients avec filtres combinés et filtrage par tenant
   */
  async findWithFilters(
    tenantId: string,
    filters: {
      type?: TYPE_CUSTOMER;
      directoryId?: string;
      companyId?: string;
      search?: string;
      limit?: number;
    } = {},
  ): Promise<Customer[]> {
    const { type, directoryId, companyId, search, limit = 200 } = filters;

    const queryBuilder = this.customerRepository
      .createQueryBuilder('customer')
      .leftJoinAndSelect('customer.directory', 'directory')
      .leftJoinAndSelect('customer.individual', 'individual')
      .leftJoinAndSelect('customer.professional', 'professional')
      .leftJoinAndSelect('customer.publicEntity', 'publicEntity')
      .leftJoinAndSelect('customer.conditionRegulation', 'conditionRegulation')
      .leftJoinAndSelect('customer.tvaRate', 'tvaRate')
      .where('directory.idTenant = :tenantId', { tenantId }); // Filtrer par tenantId dès le départ

    // Ajouter les filtres supplémentaires
    if (type) {
      queryBuilder.andWhere('customer.type = :type', { type });
    }

    if (directoryId) {
      queryBuilder.andWhere('customer.idDirectory = :directoryId', {
        directoryId,
      });
    }

    if (companyId) {
      queryBuilder
        .innerJoin('directory.directoryCompanies', 'dc')
        .andWhere('dc.idCompany = :companyId', { companyId });
    }

    // Recherche textuelle
    if (search && search.trim().length > 0) {
      const searchTerm = `%${search.trim()}%`;
      queryBuilder.andWhere(
        `(customer.code ILIKE :search OR 
         customer.email ILIKE :search OR
         individual.firstname ILIKE :search OR
         individual.lastname ILIKE :search OR
         professional.companyName ILIKE :search OR
         publicEntity.entityName ILIKE :search)`,
        { search: searchTerm },
      );
    }

    // Limiter et ordonner
    queryBuilder.take(limit).orderBy('customer.createdAt', 'DESC');

    const results = await queryBuilder.getMany();
    return results || [];
  }

  async findOne(id: string): Promise<Customer> {
    const customer = await this.customerRepository.findOne({
      where: { id },
      relations: [
        'directory',
        'individual',
        'professional',
        'publicEntity',
        'conditionRegulation',
        'tvaRate',
        'contacts',
        'billingAddress',
        'headAddress',
        'workAddresses',
      ],
    });

    if (!customer) {
      throw new NotFoundException(`Client avec l'ID ${id} introuvable`);
    }

    return customer;
  }

  async findOneWithDetails(id: string): Promise<Customer> {
    const customer = await this.customerRepository.findOne({
      where: { id },
      relations: {
        directory: true,
        individual: true,
        professional: true,
        publicEntity: true,
        conditionRegulation: true,
        tvaRate: true,
        billingAddress: { city: { country: true } },
        headAddress: { city: { country: true } },
        contacts: true,
        internalNotes: true,
        workAddresses: { city: { country: true } },
      },
    });

    if (!customer) {
      throw new NotFoundException(`Client avec l'ID ${id} introuvable`);
    }

    return customer;
  }

  async update(
    id: string,
    updateCustomerDto: UpdateCustomerDto,
  ): Promise<Customer> {
    const customer = await this.findOne(id);

    // Update main customer entity
    Object.assign(customer, updateCustomerDto);
    await this.customerRepository.save(customer);

    // Update specific customer type entity if data is provided
    if (
      updateCustomerDto.individual &&
      customer.type === TYPE_CUSTOMER.INDIVIDUAL
    ) {
      await this.customerIndividualRepository.update(
        { idCustomer: id },
        updateCustomerDto.individual,
      );
    }

    if (
      updateCustomerDto.professional &&
      customer.type === TYPE_CUSTOMER.PROFESSIONAL
    ) {
      await this.customerProfessionalRepository.update(
        { idCustomer: id },
        updateCustomerDto.professional,
      );
    }

    if (
      updateCustomerDto.publicEntity &&
      customer.type === TYPE_CUSTOMER.PUBLIC_ENTITY
    ) {
      await this.customerPublicEntityRepository.update(
        { idCustomer: id },
        updateCustomerDto.publicEntity,
      );
    }

    return await this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    const customer = await this.findOne(id);
    await this.customerRepository.softRemove(customer);
  }

  async getCustomerContacts(id: string) {
    const customer = await this.customerRepository.findOne({
      where: { id },
      relations: ['contacts'],
    });

    if (!customer) {
      throw new NotFoundException(`Client avec l'ID ${id} introuvable`);
    }

    return customer.contacts;
  }

  async getCustomerNotes(id: string) {
    const customer = await this.customerRepository.findOne({
      where: { id },
      relations: ['internalNotes'],
    });

    if (!customer) {
      throw new NotFoundException(`Client avec l'ID ${id} introuvable`);
    }

    return customer.internalNotes;
  }

  async getCustomerAddresses(id: string) {
    const customer = await this.customerRepository.findOne({
      where: { id },
      relations: ['billingAddress', 'headAddress', 'workAddresses'],
    });

    if (!customer) {
      throw new NotFoundException(`Client avec l'ID ${id} introuvable`);
    }

    return {
      billingAddress: customer.billingAddress,
      headAddress: customer.headAddress,
      workAddresses: customer.workAddresses,
    };
  }

  async updateCompleteCustomer(
    customerId: string,
    updateCustomerDto: CreateCompleteCustomerDto,
  ): Promise<Customer | null> {
    return await this.customerRepository.manager.transaction(
      async (transactionalEntityManager: EntityManager) => {
        const existingCustomer = await transactionalEntityManager.findOne(
          Customer,
          {
            where: { id: customerId },
            relations: {
              individual: true,
              professional: true,
              publicEntity: true,
              billingAddress: true,
              headAddress: true,
              contacts: true,
              internalNotes: true,
            },
          },
        );

        if (!existingCustomer) {
          throw new Error('Client non trouvé');
        }

        Object.assign(existingCustomer, {
          idDirectory: updateCustomerDto.idDirectory,
          idConditionRegulation: updateCustomerDto.idConditionRegulation,
          idTvaRate: updateCustomerDto.idTvaRate,
          email: updateCustomerDto.email,
          phone: updateCustomerDto.phone,
          origine: updateCustomerDto.origine,
          type: updateCustomerDto.type,
          status: updateCustomerDto.status,
        });

        await transactionalEntityManager.save(Customer, existingCustomer);

        await this.updateMainAddresses(
          transactionalEntityManager,
          existingCustomer,
          updateCustomerDto,
        );

        await this.updateWorkAddresses(
          transactionalEntityManager,
          existingCustomer,
          updateCustomerDto.workAddresses || [],
        );

        await this.updateContacts(
          transactionalEntityManager,
          existingCustomer,
          updateCustomerDto.contacts || [],
        );

        await this.updateInternalNotes(
          transactionalEntityManager,
          existingCustomer,
          updateCustomerDto.internalNotes || [],
        );

        await this.updateCustomerTypeSpecificEntity(
          transactionalEntityManager,
          existingCustomer,
          updateCustomerDto,
        );

        return transactionalEntityManager.findOne(Customer, {
          where: { id: customerId },
          relations: {
            individual: true,
            professional: true,
            publicEntity: true,
            billingAddress: true,
            headAddress: true,
            contacts: true,
            internalNotes: true,
            workAddresses: true,
          },
        });
      },
    );
  }

  private async updateMainAddresses(
    manager: EntityManager,
    customer: Customer,
    dto: CreateCompleteCustomerDto,
  ): Promise<void> {
    if (dto.headAddress) {
      if (dto.headAddress.id) {
        await manager.update(Address, dto.headAddress.id, {
          ...dto.headAddress,
          id: dto.headAddress.id,
        });
        customer.idHeadAddress = dto.headAddress.id;
      } else {
        const newHeadAddress = manager.create(Address, {
          ...dto.headAddress,
          customer: customer,
        });
        const savedHeadAddress = await manager.save(Address, newHeadAddress);
        customer.idHeadAddress = savedHeadAddress.id;
      }
    }

    if (dto.billingAddress) {
      if (dto.useSameAddressForBilling && customer.idHeadAddress) {
        customer.idBillingAddress = customer.idHeadAddress;
      } else if (dto.billingAddress.id) {
        await manager.update(Address, dto.billingAddress.id, {
          ...dto.billingAddress,
          id: dto.billingAddress.id,
        });
        customer.idBillingAddress = dto.billingAddress.id;
      } else {
        const newBillingAddress = manager.create(Address, {
          ...dto.billingAddress,
          customer: customer,
        });
        const savedBillingAddress = await manager.save(
          Address,
          newBillingAddress,
        );
        customer.idBillingAddress = savedBillingAddress.id;
      }
    }
  }

  private async updateWorkAddresses(
    manager: EntityManager,
    customer: Customer,
    newWorkAddresses: AddressDto[],
  ): Promise<void> {
    const existingAddresses = customer.workAddresses || [];
    const existingIds = existingAddresses.map((addr) => addr.id);
    const newIds = newWorkAddresses
      .filter((addr) => addr.id)
      .map((addr) => addr.id);

    const addressesToDelete = existingIds.filter((id) => !newIds.includes(id));
    if (addressesToDelete.length > 0) {
      await manager.delete(Address, addressesToDelete);
    }

    for (const addressDto of newWorkAddresses) {
      if (addressDto.id) {
        await manager.update(Address, addressDto.id, {
          ...addressDto,
        });
      } else {
        const newAddress = manager.create(Address, {
          ...addressDto,
        });

        newAddress.idCustomer = customer.id;
        newAddress.customer = customer;
        await manager.save(Address, newAddress);
      }
    }
  }

  private async updateContacts(
    manager: EntityManager,
    customer: Customer,
    newContacts: any[],
  ): Promise<void> {
    const existingContacts = customer.contacts || [];
    const existingIds = existingContacts.map((contact) => contact.id);
    const newIds = newContacts
      .filter((contact) => contact.id)
      .map((contact) => contact.id);

    const contactsToDelete = existingIds.filter((id) => !newIds.includes(id));
    if (contactsToDelete.length > 0) {
      await manager.delete(Contact, contactsToDelete);
    }

    for (const contactDto of newContacts) {
      if (contactDto.id) {
        await manager.update(Contact, contactDto.id, {
          ...contactDto,
          customer: customer,
        });
      } else {
        const newContact = manager.create(Contact, {
          ...contactDto,
          customer: customer,
        });
        await manager.save(Contact, newContact);
      }
    }
  }

  private async updateInternalNotes(
    manager: EntityManager,
    customer: Customer,
    newNotes: any[],
  ): Promise<void> {
    const existingNotes = customer.internalNotes || [];
    const existingIds = existingNotes.map((note) => note.id);
    const newIds = newNotes.filter((note) => note.id).map((note) => note.id);

    const notesToDelete = existingIds.filter((id) => !newIds.includes(id));
    if (notesToDelete.length > 0) {
      await manager.delete(InternalNote, notesToDelete);
    }

    for (const noteDto of newNotes) {
      if (noteDto.id) {
        await manager.update(InternalNote, noteDto.id, {
          ...noteDto,
          customer: customer,
        });
      } else {
        const newNote = manager.create(InternalNote, {
          ...noteDto,
          customer: customer,
        });
        await manager.save(InternalNote, newNote);
      }
    }
  }

  private async updateCustomerTypeSpecificEntity(
    manager: EntityManager,
    customer: Customer,
    dto: CreateCompleteCustomerDto,
  ): Promise<void> {
    if (customer.individual && dto.type !== TYPE_CUSTOMER.INDIVIDUAL) {
      await manager.delete(CustomerIndividual, { idCustomer: customer.id });
    }
    if (customer.professional && dto.type !== TYPE_CUSTOMER.PROFESSIONAL) {
      await manager.delete(CustomerProfessional, { idCustomer: customer.id });
    }
    if (customer.publicEntity && dto.type !== TYPE_CUSTOMER.PUBLIC_ENTITY) {
      await manager.delete(CustomerPublicEntity, { idCustomer: customer.id });
    }

    switch (dto.type) {
      case TYPE_CUSTOMER.INDIVIDUAL:
        if (dto.individual) {
          if (customer.individual) {
            await manager.update(CustomerIndividual, customer.individual.id, {
              ...dto.individual,
              idCustomer: customer.id,
            });
          } else {
            const newIndividual = manager.create(CustomerIndividual, {
              ...dto.individual,
              idCustomer: customer.id,
            });
            await manager.save(CustomerIndividual, newIndividual);
          }
        }
        break;

      case TYPE_CUSTOMER.PROFESSIONAL:
        if (dto.professional) {
          if (customer.professional) {
            await manager.update(
              CustomerProfessional,
              customer.professional.id,
              {
                ...dto.professional,
                idCustomer: customer.id,
              },
            );
          } else {
            const newProfessional = manager.create(CustomerProfessional, {
              ...dto.professional,
              idCustomer: customer.id,
            });
            await manager.save(CustomerProfessional, newProfessional);
          }
        }
        break;

      case TYPE_CUSTOMER.PUBLIC_ENTITY:
        if (dto.publicEntity) {
          if (customer.publicEntity) {
            await manager.update(
              CustomerPublicEntity,
              customer.publicEntity.id,
              {
                ...dto.publicEntity,
                idCustomer: customer.id,
              },
            );
          } else {
            const newPublicEntity = manager.create(CustomerPublicEntity, {
              ...dto.publicEntity,
              idCustomer: customer.id,
            });
            await manager.save(CustomerPublicEntity, newPublicEntity);
          }
        }
        break;
    }
  }
}
