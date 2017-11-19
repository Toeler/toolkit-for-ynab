import { Feature } from 'toolkit/core/feature';

export class ActivityTransactionLink extends Feature {
  injectCSS() { return require('./index.css'); }

  selectedTransaction = null
  waitingForAccountsPage = false

  invoke = () => {
    $('.budget-activity').each((index, row) => {
      $(row).addClass('toolkit-activity-row');

      $(row).on('click', () => {
        var selectedTransEmberId = $(row).attr('id');
        var emberView = ynabToolKit.shared.getEmberView(selectedTransEmberId);
        this.selectedTransaction = emberView.get('transaction');
        $('.nav-account-name[title="' + this.selectedTransaction.get('accountName') + '"]').trigger('click');
        this.waitingForAccountsPage = true;
      });
    });
  }

  // find the parent entity if the selectedTransaction has one.
  findTransactionIndex = (contentResults) => {
    var entityId = this.selectedTransaction.get('parentEntityId') || this.selectedTransaction.get('entityId');
    var transactionIndex = 0;

    for (var i = 0; i < contentResults.length; i++, transactionIndex++) {
      var currentTransaction = contentResults[i];

      if (contentResults[i].get('entityId') === entityId) {
        this.selectedTransaction = currentTransaction;
        return transactionIndex;
      }
    }

    return -1;
  }

  resetFiltersAndShowSelectedTransaction = (accountsController) => {
    function getTransactionIndex() {
      accountsController.removeObserver('contentResults', getTransactionIndex);
      var contentResults = accountsController.get('contentResults');
      var transactionIndex = this.findTransactionIndex(contentResults);
      this.showSelectedTransaction(accountsController, contentResults, transactionIndex);
    }

    accountsController.addObserver('contentResults', getTransactionIndex);
    accountsController.filters.resetFilters();
  }

  findSelectedTransaction = () => {
    var accountsController = ynabToolKit.shared.containerLookup('controller:accounts');
    var contentResults = accountsController.get('contentResults');
    var transactionIndex = this.findTransactionIndex(contentResults);

    if (transactionIndex === -1) {
      this.resetFiltersAndShowSelectedTransaction(accountsController);
    } else {
      this.showSelectedTransaction(accountsController, contentResults, transactionIndex);
    }
  }

  showSelectedTransaction = (accountsController, contentResults, transactionIndex) => {
    const ynabGrid = ynabToolKit.shared.getEmberView($('.ynab-grid').attr('id'));
    const ynabGridContainer = ynabToolKit.shared.getEmberView($('.ynab-grid-container').attr('id'));
    const $ynabGridElement = $(ynabGridContainer.element);
    const rowsAboveTransaction = $ynabGridElement.find('.ynab-grid-body > .ynab-grid-body-row').slice(0, transactionIndex);

    Ember.run.later(() => {
      const transactionScrollTo = Array.from(rowsAboveTransaction).reduce((sum, row) => {
        sum += $(row).outerHeight();
        return sum;
      }, 0);

      $ynabGridElement.scrollTop(transactionScrollTo);
      ynabGrid.uncheckAllBut(this.selectedTransaction);
    }, 250);
  }

  observe = (changedNodes) => {
    if (changedNodes.has('ynab-u modal-popup modal-budget-activity ember-view modal-overlay active')) {
      this.invoke();
    }

    if (this.waitingForAccountsPage && changedNodes.has('ynab-grid-body')) {
      this.waitingForAccountsPage = false;
      Ember.run.later(this.findSelectedTransaction, 250);
    }
  }
}
